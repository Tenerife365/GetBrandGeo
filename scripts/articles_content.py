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

# ---------------------------------------------------------------- BG-055
ARTICLES.append(dict(
    slug="bg-055", bid="BG-055", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["ChatGPT", "Platform Volatility", "AI Citation"],
    title="Why ChatGPT Citations Crashed 86 Percent, Then Came Back",
    h1="Why ChatGPT Citations Crashed <em>86 to 94 Percent</em>, Then Came Back",
    h1_plain="Why ChatGPT Citations Crashed 86 to 94 Percent, Then Came Back",
    subtitle="Between February and April 2026, ChatGPT's citation volume fell 86 to 94% across five countries at once, then mostly recovered by May. If your own numbers dropped in that window, the platform moved before your content did.",
    meta_desc="ChatGPT citations fell 86-94% across five markets between February and April 2026, then rebounded in May. What seoClarity's tracking and an independent 14-week study found, and what it means for your own numbers.",
    og_desc="A platform-wide crash, not a content problem: ChatGPT citation volume fell 86-94% in five countries on the same two dates, then came back in May. Here's what's disclosed and what still isn't.",
    ld_desc="An account of the February-April 2026 ChatGPT citation decline across five markets, its May rebound, and the disclosed tracking data behind both, with candidate causes clearly labeled as unconfirmed.",
    keywords="chatgpt citations decline 2026, why did my brand disappear from chatgpt, chatgpt citation drop, chatgpt citation volatility, ai visibility platform changes, chatgpt citation rebound",
    about=["ChatGPT", "AI Citation Volatility", "Platform Changes", "Generative Engine Optimization"],
    findings=[("86-94%", "citation volume drop vs. February baseline across five markets by late April 2026"),
              ("157%", "surge in ChatGPT referral traffic in May, after inline citations expanded"),
              ("2", "unconfirmed candidate causes on the table: a March default-model change, a February ad rollout"),
              ("5", "markets tracked: US, UK, Canada, Germany, Italy")],
    faq=[("Did my content quality cause my ChatGPT citations to drop in early 2026?",
          "Almost certainly not, if the drop landed between February and April 2026. Citation volume fell 86 to 94% across five separate markets on the same two dates, per seoClarity's tracking analysis and a corroborating independent study. A decline that uniform, across that many countries at once, points to a platform-side change, not a page-by-page content problem."),
         ("What actually caused the crash?",
          "OpenAI has not published an explanation. Two changes line up with the timing closely enough to be worth naming, though neither is confirmed as the cause: GPT-5.3 Instant became ChatGPT's default model in early March 2026, and OpenAI began rolling ads into ChatGPT starting 9 February 2026. seoClarity's own reading is that the product may have leaned more on training data and less on live retrieval during this window, offered as its interpretation rather than a stated OpenAI cause."),
         ("Did citations come back?",
          "Yes. By May 2026, citation volume across all five tracked markets had recovered toward its pre-March level, and ChatGPT referral traffic to sites surged 157% that month, coinciding with OpenAI expanding how inline citations render."),
         ("Is the volatility over now?",
          "No. This site's own reporting on <a href=\"/bg-056.html\">ChatGPT's hidden retrieval pipeline</a> found a single prompt can land on a different internal source 11.6% of the time it's repeated, and July's GPT-5.6 release <a href=\"/bg-059.html\">appears to have reshuffled citation behavior again</a>. Treat any single citation reading as a snapshot, not a verdict.")],
    related=[("/bg-056.html", "BG-056", "Inside ChatGPT's Hidden Retrieval Pipeline",
              "The mechanism behind the swings: four named internal sources, and an 11.6% chance a repeated prompt switches between them."),
             ("/bg-059.html", "BG-059", "What GPT-5.6 Changed About Who Gets Cited",
              "July's model release landed on top of this volatility. What's observed so far, and why it isn't confirmed by OpenAI."),
             _R_037],
    cta_h="See where your citations stand today, not in February",
    cta_p="Platform-wide swings like this one are exactly why one old screenshot of your AI visibility tells you very little. Run your domain now and see today's number.",
    body="""  <p>Between February and April 2026, ChatGPT's citation volume did not drift downward the way a fading feature usually does. It fell off a cliff, in five countries, on the same two dates, and then most of it came back by May. If your own tracking showed a frightening drop somewhere in that window, the honest first question is not "what did I do wrong." It's "did this happen to everyone at once."</p>

  <div class="callout">
    <div class="callout-label">How this was measured</div>
    <p>Primary source: seoClarity's own tracking analysis, written by Mitul Gandhi, the firm's chief architect and co-founder, first covering 8 February to 27 April 2026 and updated through May 2026, across five markets (US, UK, Canada, Germany, Italy), drawn from what the firm describes as millions of tracked ChatGPT interactions. A separate 14-week study by the French consultancy Resoneo, covering 27,000 ChatGPT responses through its Meteoria platform and cross-checked against Oncrawl server-log data, reported the same shape of decline on a similar timeline, per a recap published 2 August 2026. Neither firm's raw dataset is public, but both disclose their sample size and window, which is the bar this site uses before treating a claim as more than a vendor's assertion.</p>
  </div>

  <h2>The trough, market by market</h2>

  <p>By late April, citation volume sat <strong>86 to 94% below its February baseline</strong> across the five tracked markets: the UK fell 94%, Germany 90%, the US 89%, Canada 87%, Italy 86%. The US zero-citation rate, the share of prompts that returned no citation at all, doubled from 28% to 48% in March alone; Germany's zero-citation rate peaked at 85%. Two dates carried most of the damage: 8 March, when four of the five markets turned down together, and 19 April, the single worst day, when the US, UK and Germany each saw citation volume fall by more than 80% in one measurement window.</p>

  <h2>What might have caused it, and what OpenAI has actually said</h2>

  <p>Nothing, officially. OpenAI has not published an explanation tied to either date. Two changes line up with the timing closely enough to be worth naming as candidates, and neither is confirmed as the cause: GPT-5.3 Instant became ChatGPT's default model in early March 2026, and OpenAI began rolling ads into ChatGPT starting 9 February 2026. seoClarity's own theory, offered as interpretation rather than a stated OpenAI cause, is that the product may have started relying more on its training data and less on live web retrieval during this stretch. It's entirely possible more than one of these was happening at the same time, and no source in this pass isolates which one actually moved the number.</p>

  <h2>The rebound, and why it doesn't close the story</h2>

  <p>By May, citation volume across all five markets had recovered toward its pre-March level, and ChatGPT referral traffic to sites <strong>surged 157%</strong> that same month, coinciding with OpenAI expanding how inline citations render in the product. That's a real recovery, not a rounding artifact. It's also not the end of the instability. A single ChatGPT prompt, run twice, can land on a different internal retrieval source 11.6% of the time, covered in full in <a href="/bg-056.html">BG-056</a>, and July's GPT-5.6 release appears to have reshuffled citation behavior again on a separate layer entirely, covered in <a href="/bg-059.html">BG-059</a>.</p>

  <h2>How to read your own numbers against this</h2>

  <p>If a citation metric of yours cratered sometime between February and April 2026 and partly recovered by May, the disclosed data above is a plausible, and honestly the more likely, explanation before you start rewriting pages in response to it. If your numbers moved on a different timeline, or moved in only one market while your competitors' held steady in the same one, that's a different situation and worth investigating on its own terms rather than filed under this crash by default.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A drop this synchronized, across five countries, on the same two calendar dates, is a platform signature, not a content signature. It's still worth checking your own trend rather than assuming every dip is this one. That's exactly what a repeated, dated check is for, not a single reading taken once and trusted forever.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-056
ARTICLES.append(dict(
    slug="bg-056", bid="BG-056", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["ChatGPT", "Retrieval Mechanics", "Original Research"],
    title="Inside ChatGPT's Hidden Retrieval Pipeline",
    h1="Inside ChatGPT's Hidden Retrieval Pipeline. <em>One Source Handled 88%</em> of the Results",
    h1_plain="Inside ChatGPT's Hidden Retrieval Pipeline",
    subtitle="Two independent researchers reverse-engineered the system sitting behind ChatGPT's citation cards and found four named internal sources, none of them documented by OpenAI, doing wildly unequal shares of the work.",
    meta_desc="Independent research found ChatGPT routes citations through four internal sources, Labrador, Bright, Oxylabs and SERP, none publicly documented by OpenAI. What that means for how citation actually works.",
    og_desc="ChatGPT attaches a hidden result_source tag to every web result it uses. Two researchers logged thousands of them. One source, unnamed by OpenAI, handled 88% of the results they found.",
    ld_desc="A review of independently reverse-engineered findings on ChatGPT's internal retrieval and source-selection system, covering four named sources and their measured share of results, none disclosed by OpenAI.",
    keywords="how does chatgpt decide what to cite, chatgpt citation mechanism, chatgpt retrieval pipeline, chatgpt hidden search sources, chatgpt labrador bright oxylabs, ai search source selection",
    about=["ChatGPT", "Retrieval Architecture", "AI Citation Mechanics", "Generative Engine Optimization"],
    findings=[("88.1%", "share of logged ChatGPT web results traced to one retrieval source, called Labrador"),
              ("11.6%", "of repeated prompts switched their primary retrieval source between runs"),
              ("9,946", "completed ChatGPT search runs analyzed across 1,000 repeated prompts"),
              ("0", "of these source names OpenAI has itself published or explained")],
    faq=[("How does ChatGPT actually decide what to cite?",
          "Not directly from your page's SEO. Two independent researchers found ChatGPT attaches a hidden result_source field to the web results it draws on, with four observed values: Labrador, Bright, Oxylabs and SERP. Your content has to pass through whichever of these internal sources ChatGPT calls for a given query before it can be cited at all, an intermediate layer you don't control directly and OpenAI hasn't documented."),
         ("What is \"Labrador\"?",
          "The name a hidden result_source field returns for the source that accounted for 88.1% of logged web results in one independent study, appearing weighted toward established publishers and reference sites. OpenAI has not named, explained, or confirmed Labrador in any public documentation; the description here comes entirely from researchers reading ChatGPT's own network traffic."),
         ("Does this mean on-page SEO is pointless for ChatGPT?",
          "No, but it changes what you're optimizing for. Being readable, non-JavaScript-gated content with clear facts still matters once a source is in the pool a retrieval layer draws from. What this research adds is that getting into that pool in the first place, through the kind of third-party and publisher coverage BrandGEO's own research on <a href=\"/bg-035.html\">earned media citation share</a> already points to, may matter more than anything on your own site's markup."),
         ("Is any of this confirmed by OpenAI?",
          "No. It's independently reconstructed from repeated querying and captured network traffic, not an OpenAI disclosure. The source names, their shares, and even their existence as stable categories could change without notice, since nothing here is documentation OpenAI has committed to.")],
    related=[("/bg-055.html", "BG-055", "Why ChatGPT Citations Crashed 86 Percent, Then Came Back",
              "The platform-wide volatility this retrieval layer sits underneath, and the two unconfirmed causes on the table."),
             _R_044,
             _R_035],
    cta_h="Your check should read the outcome, not guess at the pipeline",
    cta_p="BrandGEO tests what ChatGPT and six other engines actually say about your brand today, on demand, instead of asking you to reverse-engineer a hidden retrieval system yourself.",
    body="""  <p>A citation in ChatGPT is not a straight line from your page to the answer. Something sits in between, deciding which pages even become candidates before the model writes a word, and that something has never been named or explained by OpenAI. Two independent researchers spent mid-2026 reading ChatGPT's own network traffic to find out what it actually is.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Two separate independent efforts, published together via Search Engine Land on 8 July 2026. Chris Green tested 1,000 prompts up to ten times each, capturing 9,946 completed search runs to measure how consistently the same prompt returns the same source. Suganthan Mohanadasan captured raw ChatGPT network traffic from a single logged-in Pro account over two days, logging roughly 1,240 source records across dozens of searches. Neither method is an OpenAI disclosure. Both are reconstructions from observed behavior, which is the honest label to put on everything below.</p>
  </div>

  <h2>Four names, and one of them does most of the work</h2>

  <p>ChatGPT attaches a field called <code>result_source</code> to the web results it uses internally, and across the logged data it returned exactly four values. <strong>Labrador accounted for 88.1%</strong> of results, skewed toward established publishers and reference sites. Bright, tied to the Bright Data scraping service, accounted for 9.9%. Oxylabs, tied to the Oxylabs scraping service, accounted for 1.7%. SERP, described as an open-web baseline, accounted for just 0.3% and showed up mostly in news-style results. None of these four names appears in any OpenAI documentation found in this pass. What each one actually is, architecturally, inside OpenAI's own system, is not publicly known; the researchers are describing what the traffic shows, not what OpenAI has confirmed.</p>

  <h2>The same prompt doesn't always hit the same pipe</h2>

  <p>The more consequential finding for anyone tracking their own citation rate: <strong>11.6% of prompts changed their primary retrieval source</strong> across repeated runs of the identical question. When that switch happened, the overlap in what actually got cited collapsed with it: URL-level overlap fell from 0.273 to 0.149, and domain-level overlap fell from 0.265 to 0.155. In plain terms, more than one in ten times you ask ChatGPT the same thing twice, it may be drawing from a genuinely different pool of the web the second time, not just re-ranking the same candidates.</p>

  <h2>What this changes about a GEO strategy</h2>

  <p>It doesn't make on-page work irrelevant. Readable, non-JavaScript-gated HTML with clear facts still matters once a page is inside whichever source ChatGPT happens to call. What it adds is a layer above that: getting into Labrador's apparent bias toward established publishers and reference coverage looks like it may matter as much as, or more than, anything you control on your own domain, which lines up with this site's earlier finding that <a href="/bg-035.html">84% of AI citations trace to earned media</a>, not owned sites. A hidden, publisher-weighted retrieval layer is one plausible mechanical reason that number looks the way it does, though this pass can't prove the two studies are describing the same underlying cause.</p>

  <div class="callout teal">
    <div class="callout-label">The honest limit here</div>
    <p>Everything above is reverse-engineered from outside the system, by researchers with no access to OpenAI's actual architecture. The names, the shares, and the 11.6% switching rate could all change on any given day without anyone outside OpenAI announcing it. Treat this as the best current account of a system nobody has fully documented, not as a fixed target to optimize against.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-057
ARTICLES.append(dict(
    slug="bg-057", bid="BG-057", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["ChatGPT", "Reasoning Modes", "AI Citation"],
    title="ChatGPT's Thinking Mode Cites Different Brands Than Instant Mode",
    h1="ChatGPT's Thinking Mode Cites <em>Different Brands</em> Than Instant Mode",
    h1_plain="ChatGPT's Thinking Mode Cites Different Brands Than Instant Mode",
    subtitle="A study of identical prompts run in both modes found only 25.6% overlap in which domains got cited. Your brand can be visible in one mode and invisible in the other, on the exact same question.",
    meta_desc="A Semrush and Kevin Indig study found only 25.6% domain overlap between ChatGPT's Thinking and Instant mode citations on identical prompts. Why a single-mode AI visibility check misses half the picture.",
    og_desc="Same prompt, same day, two ChatGPT modes: only 25.6% of the cited domains matched. Thinking mode ran 4.6x more searches and cited more government and academic sources. Instant mode leaned on Reddit.",
    ld_desc="A summary of a July 2026 Semrush and Kevin Indig study measuring citation overlap between ChatGPT's minimal and high reasoning modes on identical prompts, and its implications for AI visibility auditing.",
    keywords="chatgpt thinking mode vs instant mode citations, chatgpt reasoning mode ai visibility, chatgpt thinking mode brands, ai citation overlap study, chatgpt instant vs thinking sources",
    about=["ChatGPT", "Reasoning Modes", "AI Citation Research", "Generative Engine Optimization"],
    findings=[("25.6%", "domain overlap between ChatGPT's Thinking and Instant citations on identical prompts"),
              ("50% to 68%", "citation rate rising from minimal to high reasoning mode, same study"),
              ("4.6x", "more web searches Thinking mode ran per prompt than Instant mode"),
              ("28 pts", "largest citation-rate gap between modes, seen in the finance category")],
    faq=[("Is my brand's ChatGPT visibility a single number?",
          "No, and this study is the clearest evidence of why. Running 100 identical prompts once in minimal reasoning (roughly Instant) and once in high reasoning (Thinking) mode, Semrush and growth advisor Kevin Indig found only 25.6% of cited domains overlapped between the two. Nearly three in four sources differed on the exact same question."),
         ("Which mode should I check my brand against?",
          "Both, since you don't get to choose which one a real user hits on any given question. A check run only in Instant mode, or only forced into Thinking mode, is measuring one half of ChatGPT's actual behavior and presenting it as the whole picture."),
         ("Does Thinking mode always cite more of everything, including my kind of source?",
          "Not evenly. The study found Thinking mode's overall citation rate was higher (68% versus 50%) and it cited more sources per response (4.5 versus 2.6), but the composition shifted too: Reddit citations fell from 15% to 7% between modes, while government and academic sources rose from 1.9% to 8.8%. A brand whose visibility leans on forum or community mentions may do worse in Thinking mode even though Thinking mode cites more overall."),
         ("Will these exact numbers hold in my category?",
          "Not necessarily. The study covered four categories, B2B SaaS, finance, consumer tech, and health and lifestyle, and finance alone saw the largest citation-rate lift between modes, 28 percentage points. That's a real, disclosed finding but a single study from July 2026, not yet replicated across other categories or by another team, and worth treating as a strong first signal rather than a settled constant.")],
    related=[("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The audit method this finding extends: run more than one prompt, more than once, and now, in more than one mode."),
             ("/bg-056.html", "BG-056", "Inside ChatGPT's Hidden Retrieval Pipeline",
              "A second layer of the same problem: even within one mode, the retrieval source underneath can differ run to run."),
             ("/bg-055.html", "BG-055", "Why ChatGPT Citations Crashed 86 Percent, Then Came Back",
              "The broader platform volatility this mode-level split sits inside.")],
    cta_h="Check both modes, not just the one you happen to hit",
    cta_p="Run your domain through BrandGEO's engine checks and see your actual mention record, rather than assuming one ChatGPT answer speaks for all of them.",
    body="""  <p>Most people checking their brand's ChatGPT visibility ask one question, get one answer, and treat it as the reading. A July 2026 study suggests that reading might only be describing half of what ChatGPT actually does, because the mode you happen to be in changes which sources get cited almost as much as the prompt itself does.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Semrush and growth advisor Kevin Indig ran 100 prompts across 20 buyer journeys in four categories (B2B SaaS, finance, consumer tech, health and lifestyle), each prompt executed once in ChatGPT's minimal reasoning setting (functionally closer to Instant) and once in high reasoning (Thinking). The analysis tracked citation rates, which domains got cited, and how many internal sub-queries ChatGPT ran before answering. Published via Search Engine Land, 1 July 2026. This is a single disclosed study, not yet independently replicated, and should be read with that limit attached.</p>
  </div>

  <h2>The headline: three in four cited sources are different</h2>

  <p>Across identical prompts, run in both modes on the same day, <strong>only 25.6% of the cited domains overlapped</strong>. That means a brand cited confidently in one mode can be entirely absent from the other, on the exact same question, asked the exact same way. If your AI visibility check has only ever run one mode, and most self-checks do, you have a partial picture and no way to know how partial from a single run.</p>

  <h2>Thinking mode works harder, and that changes who it trusts</h2>

  <p>The overall citation rate rose from 50% in minimal reasoning to 68% in high reasoning, and the average number of sources per response nearly doubled, from 2.6 to 4.5. That extra effort is visible in the mechanics: Thinking mode ran roughly 4.6 times more web searches per prompt (1,130 versus 245) and fired far more comparison-stage sub-queries (24 versus 5.5). The composition of what it cited shifted along with the effort. Reddit's share of citations fell from 15% in minimal reasoning to 7% in high reasoning, while government and academic sources rose from 1.9% to 8.8%. Finance was the category where the gap mattered most, showing the largest citation-rate lift of any vertical tested, 28 percentage points between modes.</p>

  <h2>What this means for how you check yourself</h2>

  <p>The practical upshot is close to what <a href="/bg-053.html">BG-053's audit method</a> already argued for a different reason: never trust a single run. This finding adds a specific new dimension to that advice rather than replacing it. A brand that leans on community and forum mentions for its ChatGPT presence may be systematically weaker in Thinking mode, where that kind of source loses share, even while Thinking mode cites more overall. A brand backed by more formal, citable authority may see the opposite pattern. Neither is knowable from checking one mode and calling it done.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>ChatGPT is not one retrieval behavior wearing two interface labels. It's closer to two different systems that happen to share a chat window, and a brand can look strong in one and invisible in the other on the same question. Until this finding is replicated more broadly, treat it as a strong first signal that mode matters, and check both rather than assuming either one represents the whole product.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-058
ARTICLES.append(dict(
    slug="bg-058", bid="BG-058", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Schema Markup", "Google Search", "GEO Playbook"],
    title="Google Quietly Killed FAQ Rich Results in May 2026",
    h1="Google Quietly Killed FAQ Rich Results in May 2026. <em>Most GEO Advice</em> Hasn't Caught Up",
    h1_plain="Google Quietly Killed FAQ Rich Results in May 2026",
    subtitle="No blog post, no announcement, just a deprecation notice added to a developer docs page. FAQ schema no longer buys SERP real estate, and per this site's own earlier research, it never reliably bought AI citation either.",
    meta_desc="Google deprecated FAQ rich results on May 7, 2026, with no announcement. What FAQ schema can and can't do now, and why this site's own articles still use FAQPage markup despite both findings.",
    og_desc="Google killed FAQ rich results May 7, 2026, by editing a docs page, not by announcing it. Combined with a matched-control study finding no AI citation lift from schema, most GEO advice hasn't updated.",
    ld_desc="A review of Google's May 2026 deprecation of FAQ rich results, what FAQPage schema still and no longer does, and an honest accounting of why this site continues to publish FAQPage JSON-LD anyway.",
    keywords="faq rich results deprecated, google faq schema 2026, does faq schema help seo, faq schema ai citation, google removed faq rich results, faqpage schema still worth it",
    about=["Google Search", "Structured Data", "FAQ Schema", "Generative Engine Optimization"],
    findings=[("May 7, 2026", "date Google's FAQ rich results deprecation took effect"),
              ("3", "deprecation phases: SERP display, Search Console reporting, then API support"),
              ("2023", "the year FAQ rich results were already restricted to a handful of sites, three years before the full removal"),
              ("0", "statistically significant AI citation lift measured from JSON-LD schema, per BG-038's matched-control study")],
    faq=[("Did Google explain why it removed FAQ rich results?",
          "No. Per Search Engine Journal's coverage, Google didn't publish a blog post or state a reason. It added a deprecation notice to the top of its FAQ structured data developer documentation on 7 May 2026, and the removal proceeded in three phases from there: the visible rich result stopped appearing that day, Search Console's FAQ reporting and the Rich Results Test lost support in June 2026, and Search Console API support for it ends in August 2026."),
         ("Should I remove FAQPage schema from my site now?",
          "There's no need to. FAQPage remains valid Schema.org markup and doesn't cause errors or warnings by staying on a page. What it no longer does is produce the visible dropdown in Google's results."),
         ("Does FAQ schema still help me get cited by AI engines?",
          "No good disclosed evidence says it does. Ahrefs' matched-control test of 1,885 pages that added JSON-LD schema, covered in full in <a href=\"/bg-038.html\">BG-038</a>, found no statistically significant citation increase on Google AI Overviews, Google AI Mode, or ChatGPT, with AI Overviews citations actually falling. That study covered JSON-LD schema broadly, not FAQPage specifically, and no disclosed study since has isolated FAQPage alone and found a citation lift."),
         ("If it doesn't help SERP display or AI citation, why does this site still use FAQPage JSON-LD?",
          "Because the two findings above rule out one specific benefit each, not the format itself. FAQPage markup structures content into clean, discrete question and answer pairs, which is a legible shape for any reader parsing the page directly, human or machine, and per the schema study above it carries no measured downside. This site keeps using it as a zero-cost content-structure habit, not as a claimed citation lever, and says so plainly rather than implying otherwise.")],
    related=[_R_038, _R_043,
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "Item 6 of that checklist already covers the schema finding this piece builds on.")],
    cta_h="Structure your content for engines that read it, not a feature that's gone",
    cta_p="See which of your pages AI engines actually cite today, and build from evidence instead of chasing a Google rich result that's already retired.",
    body="""  <p>On 7 May 2026, Google stopped showing FAQ rich results in search. There was no blog post and no stated reason, just a deprecation notice quietly added to the top of a developer documentation page. Plenty of GEO advice circulating right now still lists FAQ schema as a citation lever, written either before this date or without noticing it. Both halves of that advice deserve a second look, because Google's removal and a separate finding this site already published about schema and AI citation point in the same direction.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Primary source: Search Engine Journal, authored by Matt G. Southern, published 10 May 2026, reporting on Google's own deprecation notice added to its FAQ structured data documentation on 7 May 2026. The removal runs in three phases: the visible SERP dropdown stopped appearing on 7 May 2026, Search Console's FAQ appearance filter, rich result report, and Rich Results Test support end in June 2026, and Search Console API support for FAQ data ends in August 2026. The AI citation claim below draws on this site's own earlier coverage of Ahrefs' matched-control schema study in <a href="/bg-038.html">BG-038</a>, not new research.</p>
  </div>

  <h2>What actually changed, and what didn't</h2>

  <p>FAQPage is still a valid Schema.org type, and the markup itself causes no errors or penalties by remaining on a page. What's gone is the payoff it used to sometimes deliver: the expandable question and answer dropdown that used to appear directly in Google's results, giving a listing more visual space on the page. Worth remembering too, per the same reporting: Google had already restricted FAQ rich results to a small set of authoritative government and health sites back in August 2023, so for the overwhelming majority of businesses this feature had been functionally invisible for close to three years before the formal removal made it official everywhere.</p>

  <h2>Does FAQ schema still help you get cited by AI?</h2>

  <p>The honest answer, based on the best disclosed evidence this site has found, is no. Ahrefs ran a matched-control test, covered in full in <a href="/bg-038.html">BG-038</a>, tracking 1,885 pages that added JSON-LD schema against control pages with similar existing citation levels that didn't. The result was no statistically significant citation increase on Google AI Overviews, Google AI Mode, or ChatGPT, and AI Overviews citations actually fell 4.6%, a result significant in the wrong direction. That study covered JSON-LD schema broadly rather than isolating FAQPage specifically, so it isn't a direct test of this one schema type. But no disclosed study found in this pass has isolated FAQPage and found a citation lift either, and the vendor claims that keep circulating a "40% weighting" figure for FAQ schema and inline citations trace to no named study, no sample size, and no stated date range.</p>

  <h2>So why does this site still mark up its own FAQs?</h2>

  <p>Because the two findings above rule out one specific claim each, a Google SERP benefit and an AI citation lift, not the underlying practice of writing content as clear questions and answers. Structuring a page that way is a legible shape for anyone parsing it directly, whether that's a human skimming for their exact question or an AI system reading the raw page during retrieval rather than working from a pre-processed index. Per the Ahrefs finding above, it carries no measured downside either. Every article on this site, including this one, still emits FAQPage JSON-LD for that reason: a zero-cost content-structure habit, stated here as exactly that, not oversold as a citation strategy it hasn't been shown to be.</p>

  <h2>What to actually prioritize instead</h2>

  <ul>
    <li><strong>Earned third-party mentions.</strong> 84% of AI citations trace to earned media, not owned-site markup, <a href="/bg-035.html">per BG-035</a>.</li>
    <li><strong>Specific, checkable claims placed next to their source.</strong> Google's own May 2026 update moved inline citations to sit beside the sentence they support rather than bundled at the end, <a href="/bg-043.html">per BG-043</a>, which changes what page-level content actually needs to look like to be citable in that surface.</li>
    <li><strong>Moderate, sustained freshness on your best pages</strong> over maximal publishing volume, the freshness pattern already covered in <a href="/bg-035.html">BG-035</a>.</li>
  </ul>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p>A tactic can lose the specific benefit it was originally adopted for and still be worth keeping, as long as the reason it's kept is stated honestly rather than quietly swapped in. FAQ schema lost Google's rich result in May 2026 and never had a proven AI citation lift to begin with. What's left is a legible content shape with no measured cost, which is a real but much smaller reason to keep it than most GEO advice currently implies.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-059
ARTICLES.append(dict(
    slug="bg-059", bid="BG-059", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["ChatGPT", "Model Updates", "AI Citation"],
    title="What GPT-5.6 Changed About Who Gets Cited",
    h1="What GPT-5.6 Changed About <em>Who Gets Cited</em>",
    h1_plain="What GPT-5.6 Changed About Who Gets Cited",
    subtitle="OpenAI's July 2026 model family shipped in three tiers, and early independent tracking suggests each one handles citation differently. None of this is an OpenAI-published finding, and it's worth reading that way.",
    meta_desc="OpenAI released GPT-5.6 on July 9, 2026 in three tiers. Early independent tracking suggests citation behavior differs by tier. What's confirmed, what's observed, and what's genuinely unknown so far.",
    og_desc="GPT-5.6 landed in three tiers, Luna, Terra, Sol, on top of an already volatile citation year. One independent analysis flagged different citation behavior per tier on launch day. Here's what that claim can and can't support.",
    ld_desc="A review of what is disclosed versus independently observed about citation behavior changes following OpenAI's July 2026 GPT-5.6 model family release, with explicit labeling of unconfirmed claims.",
    keywords="gpt-5.6 citation changes, gpt 5.6 ai visibility, gpt-5.6 sol terra luna citations, chatgpt gpt-5.6 brand citations, gpt-5.6 geo impact",
    about=["ChatGPT", "GPT-5.6", "AI Citation", "Generative Engine Optimization"],
    findings=[("July 9, 2026", "OpenAI's own release date for the GPT-5.6 model family"),
              ("3", "GPT-5.6 tiers reportedly showing different citation behavior, per one independent analysis"),
              ("300,000 tokens", "context point where the smallest tier was observed shifting from citing to summarizing, unconfirmed"),
              ("0", "OpenAI statements found describing a citation-behavior change tied to GPT-5.6")],
    faq=[("Did OpenAI say GPT-5.6 would change which brands get cited?",
          "No. GPT-5.6's release itself is confirmed, disclosed, and dated: OpenAI shipped the model family on 9 July 2026 in three tiers, Luna, Terra, and Sol. Nothing in OpenAI's own release material found in this pass describes a citation-behavior change. The claims about citation differences between tiers trace entirely to one independent analysis flagged on launch day, and that analysis states outright that it's too early for a universal number."),
         ("Which GPT-5.6 tier should I test my brand against?",
          "You can't choose, in practice, since a real user's query resolves to whichever tier the product routes it to. Given how early and unconfirmed the per-tier claims still are, this is a better argument for re-running your own check soon after a major release than for trying to isolate and optimize against one specific tier."),
         ("Is this connected to the citation crash covered elsewhere on this site?",
          "Related in timing, not confirmed as the same cause. <a href=\"/bg-055.html\">BG-055</a> covers a February to April 2026 crash and May rebound, attributed to unconfirmed platform and model-default changes. GPT-5.6 is a separate July event, landing on top of that already unstable stretch, not a continuation of the same documented cause."),
         ("How would I actually find out if GPT-5.6 changed my own results?",
          "Run your own before-and-after comparison. No third-party source in this pass discloses per-brand data on GPT-5.6's citation effects, so the audit method in <a href=\"/bg-053.html\">BG-053</a>, run the same prompts, more than once, and compare, is the only way to answer this for your specific brand right now.")],
    related=[("/bg-055.html", "BG-055", "Why ChatGPT Citations Crashed 86 Percent, Then Came Back",
              "The volatile stretch GPT-5.6 landed on top of, and the two candidate causes still unconfirmed for that earlier crash."),
             ("/bg-056.html", "BG-056", "Inside ChatGPT's Hidden Retrieval Pipeline",
              "A separate, already-hidden layer of citation mechanics that GPT-5.6's tiers sit on top of, not instead of."),
             ("/bg-057.html", "BG-057", "ChatGPT's Thinking Mode Cites Different Brands Than Instant Mode",
              "Another axis of the same problem: mode changes citations by itself, before a model-tier difference is even added in.")],
    cta_h="Re-run your check after every model shift, not just once",
    cta_p="A model release is exactly the moment a stale AI visibility snapshot misleads you most. See your current numbers on BrandGEO now.",
    body="""  <p>On 9 July 2026, OpenAI shipped GPT-5.6, its next model family after GPT-5.5, arriving in three tiers named Luna, Terra, and Sol, ranked from least to most capable. That part is confirmed and dated. What happened next to citation behavior is a much thinner, much more provisional story, and it deserves to be told that way rather than folded into a confident headline.</p>

  <div class="callout">
    <div class="callout-label">What's disclosed, and what isn't</div>
    <p>The release date and the three-tier structure come from OpenAI's own announcement and were independently confirmed by outlets including TechCrunch on launch day. Everything below about citation behavior differing by tier traces to a single source: an analysis published by GEO-tooling vendor Topify, flagged the same day the model shipped, 9 July 2026. That analysis states plainly that "it's too early for a universal number." Nothing here is an OpenAI-published methodology or a peer-reviewed study. It's one vendor's early, honestly-hedged observation, and it's presented here under that label, not as settled fact.</p>
  </div>

  <h2>Three tiers, three reportedly different citation habits</h2>

  <p>Per Topify's early tracking, <strong>Sol</strong>, the most capable and expensive tier, showed deeper reasoning and more consistent citation retrieval across long contexts, while defaulting to shorter answers than GPT-5.5 gave. <strong>Terra</strong>, the mid-tier workhorse, reportedly began missing references once a conversation passed roughly 500,000 tokens of context. <strong>Luna</strong>, the smallest and, as of a price cut on 30 July 2026, now 80% cheaper tier, reportedly started summarizing sources instead of citing them at around 300,000 tokens. None of these three figures comes from OpenAI, and none has been independently replicated by a second source in this pass. Treat them as a first, unconfirmed read rather than a spec sheet.</p>

  <h2>Why "ChatGPT" on your dashboard is now an average of at least three things</h2>

  <p>If your AI visibility tracking still reports a single "ChatGPT" line, that line was already averaging over the mode split covered in <a href="/bg-057.html">BG-057</a> (only 25.6% domain overlap between Thinking and Instant on identical prompts) and the hidden retrieval-source instability covered in <a href="/bg-056.html">BG-056</a> (an 11.6% chance a repeated prompt lands on a different internal source). GPT-5.6's reported per-tier differences, unconfirmed as they still are, would add a third axis on top of those two. Mode, retrieval source, and now possibly model tier are three separate places citation behavior can diverge on what looks to a user like the exact same product.</p>

  <h2>What to actually do with an unconfirmed finding like this</h2>

  <p>Not overreact to it. There's no case here for redesigning content around a specific token threshold that one vendor observed on launch day and hasn't yet verified at scale. What this does support is the same advice this site has already given for a different reason in <a href="/bg-053.html">BG-053</a>: re-run your own check, on your own prompts, rather than trusting a reading taken before the model you're now being evaluated by even existed. A major model release is one of the more obvious moments a stale snapshot stops describing reality.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>GPT-5.6 is real, dated, and disclosed. What it did to citation behavior, tier by tier, is currently one vendor's early observation, offered with its own explicit disclaimer that it's too soon to generalize. The right response to a finding like that isn't to ignore it or to treat it as settled. It's to note it, watch for independent replication, and check your own numbers again rather than waiting for someone else to hand you a confirmed answer.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-060
ARTICLES.append(dict(
    slug="bg-060", bid="BG-060", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Perplexity", "AI Search Trends", "GEO Strategy"],
    title="Perplexity Is Losing AI Search Share Even as Comet Goes Free",
    h1="Perplexity Is Losing AI Search Share <em>Even as Comet Goes Free</em>",
    h1_plain="Perplexity Is Losing AI Search Share Even as Comet Goes Free",
    subtitle="Its browser reportedly climbed the app charts the same year its share of US AI-search referral traffic reportedly fell by more than a third. Both things can be true at once, and the gap between them is the actual lesson here.",
    meta_desc="Perplexity's reported US AI-search referral share fell from roughly 11.4% to 6.85% even as Comet went free and reportedly reached #3 on iOS charts. What the apparent contradiction means for how you should check GEO channel performance.",
    og_desc="A growing app and a shrinking slice of AI referral traffic are not a contradiction once you separate the two metrics. What Perplexity's reported numbers actually mean for where you check your own AI-search results.",
    ld_desc="An analysis of Perplexity's reported decline in US AI-search referral traffic share alongside Comet's reported app-store growth, and what the distinction between users and referral share means for brand GEO monitoring.",
    keywords="perplexity market share decline 2026, is perplexity still relevant for geo, perplexity ai search share, comet browser free, perplexity ai referral traffic, ai search engine market share 2026",
    about=["Perplexity", "AI Search Market Share", "Comet Browser", "Generative Engine Optimization"],
    findings=[("11.4%", "Perplexity's reported share of US AI-search referral traffic earlier in 2026"),
              ("6.85%", "its reported share of that same referral traffic by mid-2026"),
              ("#3", "Comet's reported rank among free apps on the US iOS App Store after going free"),
              ("2", "different metrics, users and referral share, that this story only resolves once you separate them")],
    faq=[("Is Perplexity losing users?",
          "Not according to the same reporting that shows the referral-share decline. The number that reportedly fell is Perplexity's share of US AI-search referral traffic, a measure of how much of the traffic flowing from AI platforms to websites originates there. Comet going free and reportedly climbing app-store charts points toward user growth, not user loss, on a separate metric entirely."),
         ("How can an app grow while its market share shrinks?",
          "Referral share is measured against the total pool of AI-referral traffic across every engine, not against Perplexity's own past traffic in isolation. If ChatGPT, Gemini and Claude are all pulling in referral traffic faster than Perplexity is, Perplexity's slice of the pie shrinks in percentage terms even if its own absolute numbers hold steady or grow. A browser default answer, answered inside Comet rather than sent out as a referral click, can also behave differently from a standalone search query."),
         ("Does BrandGEO still track Perplexity?",
          "Yes. Perplexity is one of the seven engines BrandGEO monitors across ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok and Google AI Overviews, subject to plan-level engine gating. A referral-share headline is a reason to check your own numbers on an engine, not a reason to stop watching it."),
         ("What should a GEO strategy actually do with a headline like this one?",
          "Check your own AI referral logs before adjusting anything. A category-wide share figure describes an average across every brand and every vertical; it says nothing about whether your specific brand's mentions on that specific engine went up, down or stayed flat.")],
    related=[("/bg-061.html", "BG-061", "Claude's AI Referral Traffic Spiked 320 Percent in One Month",
              "The engine most brands under-track, and why the headline number needs one clarification before you repeat it."),
             ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "Four genuinely different retrieval architectures, and why what works for one does not automatically transfer."),
             ("/bg-041.html", "BG-041", "How Many AI Engines Does a GEO Tool Actually Need to Cover?",
              "Why a bigger named engine count is not automatically more useful once you check which engines are actually gated.")],
    cta_h="Check where your AI referral traffic actually comes from",
    cta_p="A category-wide headline tells you nothing about your own brand's numbers. Run your domain and see which engines are actually sending you traffic today.",
    body="""  <p>Two things about Perplexity were reportedly true at the same time in 2026: its share of US AI-search referral traffic fell by more than a third, and its Comet browser went free and reportedly climbed into the top handful of free apps on the US iOS App Store. Read as a single headline, that looks like a contradiction. Read as two separate metrics, it is not, and the difference is worth walking through carefully before anyone updates a GEO strategy off the wrong one.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>The referral-share figures here (roughly <strong>11.4%</strong> falling to roughly <strong>6.85%</strong>) come from the same category of AI-referral-traffic tracking that Similarweb-style panel data has produced elsewhere this year, including the publicly reported shift in ChatGPT's own worldwide referral share over the same window. The specific Perplexity figures are reported industry numbers, not figures this piece independently audited, and the underlying panel methodology was not fully disclosed in what is publicly available. Comet's app-store rank is similarly a reported figure from app-intelligence tracking, not a first-party Apple disclosure. Treat both as directional industry signals, not verified facts to repeat as settled.</p>
  </div>

  <h2>Two numbers that are measuring different things</h2>

  <p>Referral share answers one question: of all the traffic flowing from AI platforms to websites, what portion originates at Perplexity. It does not measure how many people use Perplexity, how many queries they run, or how satisfied they are. Comet's app-store rank answers a different question entirely: how many people are installing and opening a specific app. A platform can add users faster than ever while its referral share still falls, if the rest of the category (ChatGPT, Gemini, Claude, Google AI Mode) is growing its own referral traffic even faster from a larger base.</p>

  <p>There is also a structural reason a browser specifically might not move referral share the way a chat interface does. When Comet answers a question inline, inside the browsing session, that interaction does not necessarily register as an outbound referral click the way a standalone search-then-click sequence does. A browser built to act on a user's behalf, rather than hand them a list of links, can grow its user base while producing fewer of the countable outbound referrals that a share-of-traffic metric depends on.</p>

  <h2>Why this matters for GEO strategy specifically</h2>

  <p>The mistake this kind of headline invites is assuming engine relevance can be read off a single popularity or share number, in either direction. <a href="/bg-044.html">Different engines retrieve and cite sources through genuinely different architectures</a>, and Perplexity's own claimed retrieval design leans hard on breadth of index and citation density as its differentiator, a design choice that a referral-share number does not capture at all. A brand that is well cited inside Perplexity answers has something real, regardless of what the platform's aggregate share of category-wide traffic is doing.</p>

  <p>The only number that actually tells you whether to keep investing attention in an engine is your own. Server-side analytics, referral-source breakdowns, or a GEO tool that checks your specific brand against your specific prompts on that specific engine will tell you something a market-share headline cannot: whether Perplexity is sending you anything at all, and whether that changed.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A market-share decline and a user-growth story can both be true, because they are answers to different questions. Don't let a headline about category-wide traffic share stand in for a check of your own AI referral logs. The two numbers move independently, and only one of them is about your brand.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-061
ARTICLES.append(dict(
    slug="bg-061", bid="BG-061", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Claude", "AI Referral Traffic", "GEO Strategy"],
    title="Claude's AI Referral Traffic Spiked 320 Percent in One Month",
    h1="Claude's AI Referral Traffic <em>Spiked 320 Percent</em>",
    h1_plain="Claude's AI Referral Traffic Spiked 320 Percent in One Month",
    subtitle="The 320 percent figure making the rounds is a year-over-year growth number, not a single month's jump. The single month, March 2026, reportedly spiked around 159 percent on its own, and it is the more interesting stat of the two.",
    meta_desc="Claude's AI-referral website traffic reportedly grew about 320% year over year, with a single-month spike near 159% in March 2026. Why Claude is the most under-tracked of the major engines, and what the growth means for GEO.",
    og_desc="Most brands track ChatGPT and Perplexity and barely check Claude. Its reported referral-traffic growth this year says that is a mistake, and it cites sources in only about half its responses to begin with.",
    ld_desc="An examination of Claude's reported AI-referral traffic growth in 2026, why Claude is commonly under-tracked in brand GEO monitoring, and what its disclosed citation rate implies for content strategy.",
    keywords="claude ai referral traffic growth, does claude cite websites, claude ai search visibility, claude vs chatgpt citations, anthropic claude web search, claude geo strategy",
    about=["Claude", "AI Referral Traffic", "Generative Engine Optimization", "AI Search Trends"],
    findings=[("320%", "Claude's reported year-over-year growth in AI-referral website traffic"),
              ("159%", "the reported single-month spike in Claude referral traffic in March 2026"),
              ("55%", "the share of Claude responses that include a source citation, per Muck Rack's disclosed 25-million-link study"),
              ("96%", "ChatGPT's citation rate on the same disclosed study, for comparison")],
    faq=[("Is the 320 percent figure a single month's growth?",
          "No, and this is worth correcting directly since it gets conflated in headline form. The 320% figure is a reported year-over-year growth rate for Claude's AI-referral website traffic. The single-month figure, reported near 159%, refers specifically to a spike in March 2026, a different and smaller window inside that same year."),
         ("Why is Claude under-tracked by brands compared to ChatGPT or Perplexity?",
          "Claude has no dedicated, separately marketed web-search product the way ChatGPT and Perplexity do. Its web search runs as a background Server Tool rather than a headline feature, so it gets far less standalone press coverage and fewer brands think to check it, even though it is a fully functioning citation-producing engine when the tool is used."),
         ("Does Claude actually cite websites?",
          "Yes, every response that uses Claude's web search tool includes citations by default, and the underlying search runs through Brave Search rather than Google or Bing. But Claude cites a source in only about 55% of its responses overall, per Muck Rack's disclosed 25-million-link study, well below ChatGPT's 96% and Gemini's 82% on the same measure, so citation frequency itself is the gap worth watching, not just whether citation happens at all."),
         ("Does BrandGEO monitor Claude?",
          "Yes. Claude is one of the seven engines BrandGEO tracks across ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok and Google AI Overviews, subject to plan-level engine gating.")],
    related=[("/bg-062.html", "BG-062", "Gemini's AI Referral Traffic Grew 231 Percent and Almost Nobody Is Watching It",
              "The other engine most brands underrate, and why BrandGEO's own Free plan bets on it specifically."),
             ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "Four genuinely different retrieval architectures, and why what works for one does not automatically transfer."),
             ("/bg-060.html", "BG-060", "Perplexity Is Losing AI Search Share Even as Comet Goes Free",
              "A different engine, the same lesson: a headline growth or decline number is not a substitute for checking your own traffic.")],
    cta_h="See if Claude is already mentioning your brand",
    cta_p="Claude cites sources in about half its responses. Find out whether yours is one of the brands it names, on your own domain, in about a minute.",
    body="""  <p>The headline version of this stat is doing more work than it should. Claude's AI-referral website traffic reportedly grew around <strong>320% year over year</strong>, and that number gets repeated as if it describes a single explosive month. It does not. The actual single-month figure, reported near <strong>159%</strong> for March 2026 specifically, is the more interesting number here, and conflating the two obscures what is genuinely notable: a sustained, compounding climb across most of the year, with one identifiable month where it accelerated hardest.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>Both figures trace to the same category of AI-referral-traffic analytics that publishers like Adobe Digital Insights and Similarweb have used elsewhere in 2026 to track engine-level referral behavior, not to a controlled study with a disclosed sample or an independently reproducible method. Treat 320% and 159% as industry-reported traffic-analytics figures, directional but not independently audited here. What is independently disclosed, and cited below, is Claude's actual citation rate from Muck Rack's separate 25-million-link study, which is a different measurement entirely: how often Claude cites a source, not how much referral traffic results from it.</p>
  </div>

  <h2>Why Claude is the engine brands forget to check</h2>

  <p>ChatGPT has a search mode brands can point at directly. Perplexity's entire product identity is built around search and citation. Claude's web search, by contrast, runs as a background <strong>Server Tool that Anthropic operates in the cloud</strong>, backed by Brave Search rather than a direct Google or Bing connection, with no separately marketed "Claude Search" product pulling press coverage the way its competitors' search features do. <a href="/bg-044.html">The architecture is genuinely different from the other three major engines</a>, and it is also quieter, which is exactly the combination that gets a channel skipped in a monitoring setup that was built around whichever engines happen to make headlines.</p>

  <p>A traffic figure like 320% year over year is the kind of thing that should force a reconsideration of that habit, whatever its exact precision. Even taken as a directional signal rather than an audited fact, it says the channel is not standing still, and a brand that has never checked whether Claude mentions it at all has no way of knowing whether that growth is passing it by.</p>

  <h2>The citation-rate gap underneath the growth</h2>

  <p>Growth in referral traffic does not automatically mean growth in how often Claude cites any given brand. Muck Rack's disclosed 25-million-link study puts Claude's citation rate at <strong>55%</strong> of responses, compared to <strong>96%</strong> for ChatGPT and 82% for Gemini on the same measure. Claude answers without a citation nearly half the time it responds at all, which means the referral traffic that does exist is concentrated into a smaller share of its total output than on the other two engines. That makes checking whether your specific brand shows up inside the responses that do cite something more important on Claude than it would be on an engine that cites almost every time.</p>

  <h2>What to do with a growth stat you cannot fully verify</h2>

  <p>Neither 320% nor 159% comes with a disclosed sample size or methodology strong enough to treat as settled fact, and this piece is not presenting them that way. What they are useful for is prioritization: a reported multi-hundred-percent growth trend, even hedged, is a stronger signal to go check your own numbers than silence would be. The actual answer for your brand still requires looking at your own data, not repeating someone else's percentage.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>320% is the year, not the month. 159% is the month, not the year. Both are industry-reported, not independently audited. And neither number replaces checking whether Claude, in the roughly half of its responses that carry a citation at all, is naming your brand or someone else's.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-062
ARTICLES.append(dict(
    slug="bg-062", bid="BG-062", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Gemini", "AI Referral Traffic", "Free Tier Strategy"],
    title="Gemini's AI Referral Traffic Grew 231 Percent and Almost Nobody Is Watching It",
    h1="Gemini's AI Referral Traffic Grew <em>231 Percent</em>, Almost Unwatched",
    h1_plain="Gemini's AI Referral Traffic Grew 231 Percent and Almost Nobody Is Watching It",
    subtitle="Gemini has the reputation of a default nobody chose, bundled into products people already had open. The reported growth number does not match that reputation, and neither does the reason it is the one engine BrandGEO puts on its free tier.",
    meta_desc="Gemini's AI-referral website traffic reportedly grew about 231% year over year, yet it remains the least discussed major AI search engine. Why the boring-default reputation understates it, and why Free-tier GEO tools default to it.",
    og_desc="Nobody writes headlines about Gemini the way they write them about ChatGPT or Perplexity. Its reported referral traffic growth this year, and its own citation rate, argue that gap is a mistake to keep making.",
    ld_desc="An analysis of Gemini's reported AI-referral traffic growth in 2026, its disclosed citation behavior, and why Google's grounding pricing and disclosed citation rate make it a defensible default engine at low budget tiers.",
    keywords="gemini ai search growth 2026, gemini ai visibility, gemini referral traffic, gemini grounding pricing, does gemini cite sources, free geo tool gemini",
    about=["Gemini", "AI Referral Traffic", "Generative Engine Optimization", "AI Search Trends"],
    findings=[("231%", "Gemini's reported year-over-year growth in AI-referral website traffic"),
              ("82%", "Gemini's citation rate per Muck Rack's disclosed 25-million-link study, second only to ChatGPT's 96%"),
              ("$14", "per 1,000 search queries Google now charges for Gemini's web-search grounding, down from a flat $35 per 1,000 prompts"),
              ("1", "the number of AI engines BrandGEO's Free plan collects through today: Gemini")],
    faq=[("Why does Gemini have a boring-default reputation?",
          "It ships bundled inside products people already had open, Search, Android, Workspace, rather than as a destination someone deliberately chooses the way they choose to open ChatGPT or Perplexity. That makes it easy to use constantly and easy to underrate, since it gets little of the standalone press coverage a dedicated search product attracts."),
         ("Is the 231 percent growth figure verified?",
          "No, treat it as a reported, industry-tracked traffic-analytics figure rather than an independently audited number. It comes from the same category of AI-referral-traffic tracking used elsewhere in 2026 reporting on engine-level referral behavior, without a fully disclosed panel methodology."),
         ("Why does BrandGEO's Free plan collect through Gemini specifically?",
          "It is a deliberate, cost-driven decision. At the Free tier's monthly collection budget, Gemini's grounded search pricing is the engine that fits reliably within it; the product's engine set was explicitly amended from an earlier default to Gemini in mid-2026 for exactly this reason, so that the Free tier stays a genuine subset of the paid tiers' engine coverage rather than one that drops an engine paid users get."),
         ("Does starting on Gemini put a Free user at a disadvantage?",
          "Not structurally. Every paid BrandGEO plan adds engines on top of Gemini rather than swapping it out, and Gemini's own disclosed citation rate, 82% in Muck Rack's study, is the second-highest of the four engines that study measured, behind only ChatGPT.")],
    faq_note=None,
    related=[("/bg-061.html", "BG-061", "Claude's AI Referral Traffic Spiked 320 Percent in One Month",
              "The engine most brands under-track, and why the headline number needs one clarification before you repeat it."),
             ("/bg-060.html", "BG-060", "Perplexity Is Losing AI Search Share Even as Comet Goes Free",
              "A different engine, the same lesson: a headline growth or decline number is not a substitute for checking your own traffic."),
             ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "Four genuinely different retrieval architectures, and why what works for one does not automatically transfer.")],
    cta_h="Start free, and start on the engine with the numbers",
    cta_p="BrandGEO's free plan checks your brand against Gemini today, the engine this piece is actually about. No signup and no card required to see your first result.",
    body="""  <p>Ask most marketers to rank AI engines by importance and Gemini tends to land somewhere in the middle, described as the default nobody actively picked, present because it ships bundled into Search, Android and Workspace rather than because anyone opened a tab and chose it. The reported traffic numbers for 2026 do not support parking it there. Gemini's AI-referral website traffic reportedly grew around <strong>231% year over year</strong>, a figure that puts it squarely in the same conversation as the growth stories that do get written about, even if nobody is writing them about Gemini.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>The 231% growth figure is a reported industry traffic-analytics number, from the same category of AI-referral tracking used elsewhere in 2026 reporting, not an independently audited study with a disclosed panel or sample size. Treat it as a directional signal. What is separately disclosed and independently citable is Gemini's actual citation behavior, from Muck Rack's 25-million-link "Generative Pulse" study across three editions since July 2025, and Google's own published grounding pricing changelog, both referenced below with their own sourcing.</p>
  </div>

  <h2>A default that quietly cites more often than it gets credit for</h2>

  <p>Muck Rack's disclosed study puts Gemini's citation rate at <strong>82%</strong> of responses, the second-highest of the engines it measured, ahead of Claude's 55% and behind only ChatGPT's 96%. That is not a marginal or default-tier number. It sits well inside the range of engines that actively and consistently cite sources, closer to ChatGPT's behavior than to Claude's. The "boring default" framing describes Gemini's distribution channel, not its underlying citation behavior, and those are two different things worth separating before deciding an engine does not matter.</p>

  <h2>Gemini's retrieval got more expensive to run, and more capable</h2>

  <p>Underneath the growth, Google changed how it bills the search step Gemini uses to ground its answers in live results. Since <strong>January 5, 2026</strong>, Grounding with Google Search moved from a flat $35 per 1,000 prompts to usage-based pricing at <strong>$14 per 1,000 search queries</strong>, with a single prompt able to trigger more than one billable search if the model decides it needs several. That pricing shift, paired with new combinable modes like Grounding with Google Maps and Structured Outputs for the Gemini 3 model family, points to an engine Google is actively investing in as retrieval infrastructure, not a static feature it shipped once and left alone.</p>

  <h2>Why BrandGEO's Free plan is built on this engine specifically</h2>

  <p>This is not incidental to the growth story. BrandGEO's Free plan collects brand mentions through Gemini alone, a deliberate, cost-driven engineering decision, not an arbitrary starting point. At the budget a free tier can sustain, Gemini's grounded search pricing is the one that reliably fits, and the product's own engine defaults were explicitly amended to Gemini in mid-2026 specifically so a Free-tier user is never missing an engine that a paying user gets, only starting with fewer of them. A reported 231% growth trend and an 82% citation rate are exactly the kind of numbers that make that choice look less like a compromise and more like picking the strongest single free-tier bet available.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Gemini's reputation as the engine nobody deliberately opens does not match its reported growth or its disclosed citation behavior. If your GEO monitoring habit skips it because it never makes headlines, the numbers say that habit is worth reconsidering, not because Gemini is suddenly interesting, but because it may have been under-watched the whole time.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-063
ARTICLES.append(dict(
    slug="bg-063", bid="BG-063", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["AI Browsers", "Agentic Commerce", "GEO Strategy"],
    title="AI Browsers Just Crossed 10 Million Users. Here Is What Changes for Brands.",
    h1="AI Browsers Just Crossed <em>10 Million Users</em>",
    h1_plain="AI Browsers Just Crossed 10 Million Users. Here Is What Changes for Brands.",
    subtitle="An agentic browser does not just return links, it acts, comparing, adding to cart, sometimes checking out. That moves the point of being found further upstream than a results page, and most brands are not yet built for it.",
    meta_desc="Agentic AI browsers reportedly crossed 10 million monthly users. What agentic commerce actually means for brands: an agent acting on a user's behalf, and what structured product data a brand needs to be picked rather than found.",
    og_desc="A results page shows a human ten links. An agentic browser can skip straight to comparing, adding to cart, and paying. What that shift requires from a brand's product data before an agent ever gets involved.",
    ld_desc="An explainer on agentic AI browsers reportedly crossing 10 million monthly users, what agentic commerce means in practice, and what structured, machine-parseable product information a brand needs to be selected by a shopping agent.",
    keywords="ai browser agentic commerce 2026, ai shopping agents, agentic checkout brands, comet browser agentic commerce, universal commerce protocol, ai agent product data",
    about=["AI Browsers", "Agentic Commerce", "Generative Engine Optimization", "AI Search Trends"],
    findings=[("10M+", "reported monthly active users across agentic AI browsers, an industry-tracked figure, not independently audited"),
              ("UCP", "the Universal Commerce Protocol, an open standard Google and Shopify co-developed to let AI agents complete checkout"),
              ("Jan 8, 2026", "the US launch date of Copilot Checkout, in-chat purchasing across Copilot, Bing, MSN and Edge"),
              ("2", "genuinely separate AI surfaces this piece is careful not to conflate: Google AI Mode and Google AI Overviews")],
    faq=[("What does agentic commerce actually mean?",
          "It means the browser or assistant itself takes action on a user's behalf, comparing options, adding an item to a cart, and in some cases completing checkout, rather than only returning a list of links or a summarized answer for a human to act on manually. The Universal Commerce Protocol, co-developed by Google and Shopify and announced in January 2026, is one concrete open standard built to let this happen without a human navigating a merchant's site directly."),
         ("Is this the same thing as Google AI Overviews or AI Mode showing a product?",
          "No, and the two should not be conflated. AI Overviews and AI Mode are answer surfaces inside Google Search that summarize information and can surface links, including product information. Agentic checkout is a further step downstream: the agent does not just describe or link to a product, it can act, selecting, adding to cart and paying, with the browsing or purchasing decision partly or fully delegated."),
         ("What does a brand need in place to be picked by a shopping agent rather than just found by a human?",
          "Structured, factual, machine-parseable product information, price, availability, specifications, and variant data in a consistent format an agent can parse reliably, matters more here than persuasive marketing copy does, since an agent is extracting and comparing facts rather than reading with the attention a human shopper brings. This is a different requirement from what gets a page cited in a conversational AI answer, and the two should be treated as separate problems rather than assumed to be solved by the same content."),
         ("Can BrandGEO tell me whether an AI shopping agent will choose my product?",
          "Not yet, and it is worth being direct about that rather than implying otherwise. BrandGEO's current monitoring covers whether its seven tracked engines mention or cite a brand in conversational answers. Whether a downstream shopping agent actually selects a specific product for checkout is a distinct, newer measurement problem the category is still building toward, not something today's citation tracking answers on its own.")],
    related=[("/bg-060.html", "BG-060", "Perplexity Is Losing AI Search Share Even as Comet Goes Free",
              "The browser behind part of this shift, and why its own referral-traffic numbers tell a more complicated story than user growth alone."),
             ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "The retrieval mechanics an agent still has to work through before it ever gets to comparing or buying anything."),
             ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The traffic numbers behind why measurement further upstream than a results page is worth taking seriously.")],
    cta_h="Get found before an agent even opens a tab",
    cta_p="Being cited in a conversational answer and being selected by a shopping agent are different problems. Check the first one on your own domain now, free, while the second is still being built.",
    body="""  <p>Agentic AI browsers, tools built to act inside a session rather than only answer inside one, reportedly crossed <strong>10 million monthly active users</strong> in 2026. Treated as a bare user-count milestone, that number is easy to skim past. Treated as a signal about where a purchase decision now actually happens, it is not. The interesting part is not that people are using these browsers. It is what the browsers are increasingly built to do once they are open: not just search, but act.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>The 10 million-plus figure is a reported, industry-tracked user count for agentic AI browsers as a category, not an independently audited number with a disclosed panel methodology, and this piece treats it that way. What is independently and separately disclosed: the Universal Commerce Protocol, co-developed by Google and Shopify and announced in January 2026, with Walmart, Target, Visa, Mastercard, American Express and Stripe endorsing it, expanding from a US-first rollout toward Canada and Australia by mid-2026; and Copilot Checkout, launched in the US on January 8, 2026, adding in-chat purchasing across Copilot, Bing, MSN and Edge with PayPal, Shopify, Stripe and Etsy as launch partners. Both are cited to their own public announcements, not bundled into the undisclosed user-count figure.</p>
  </div>

  <h2>From returning links to taking action</h2>

  <p>A conventional search result, and even a conversational AI answer, still ends with a human deciding what to do next: click, compare, buy. Agentic commerce moves that decision point earlier. The Universal Commerce Protocol is explicitly designed to let an AI agent complete product selection, payment and confirmation on a merchant's behalf, without a human navigating the site at all. Microsoft's Copilot Checkout does the narrower version of the same thing inside its own chat surface. Neither of these is a hypothetical roadmap item; both are live, named, dated launches with named commerce partners attached.</p>

  <p>This is a genuinely different surface from Google AI Mode or Google AI Overviews, and the two should not be treated as interchangeable. AI Mode and AI Overviews summarize and surface information inside a search session, including product information, but the human is still the one who acts on it. Agentic checkout is a further step downstream of that: the acting itself gets delegated, partly or fully, to the agent.</p>

  <h2>What "getting found" means once the browser can act</h2>

  <p>If an agent is going to compare products and select one, the thing it needs from a brand is not a persuasive product page written for a human's attention span. It needs structured, factual, machine-parseable data: price, availability, specifications, variant options, in a format the agent can extract reliably and compare against a competitor's equivalent data with the same reliability. Marketing copy tuned to persuade a human reader is not the same asset as a clean, structured feed an agent can parse without error, and a brand that has only built the first one is not automatically ready for the second.</p>

  <p>It is worth being honest here about what this does and does not overlap with existing GEO work. The kind of content that earns a citation inside a conversational AI answer, disclosed third-party mentions, freshness, clear sourcing, is a related but separate discipline from what makes a product selectable by a checkout agent. Structured data alone has already been shown, in a separate matched-control study on schema markup, to correlate with citation without causing it. Whether structured product data causally improves agent selection rates is an even newer question, and nobody in this category, BrandGEO included, has a disclosed, audited answer to it yet.</p>

  <h2>What to do before the answer exists</h2>

  <p>The honest starting point is the boring one: make sure product price, availability and specification data is accurate, current and available in a structured, standard format, the same baseline hygiene that has always mattered for any downstream system reading a product catalog. That does not guarantee selection by an agent any more than schema markup guarantees an AI citation. It is the minimum precondition for being legible to one at all, which is a lower bar than being chosen, but a bar a surprising number of product catalogs still fail.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>10 million users is a headline number about adoption. The more useful fact underneath it is that some of those users are now delegating the comparing and buying, not just the searching, to the browser itself. Getting found by a human and getting picked by an agent are becoming two different problems, and most brands have only started building for the first one.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-064
ARTICLES.append(dict(
    slug="bg-064", bid="BG-064", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["GEO Industry", "Startup Postmortem", "GEO Tooling"],
    title="A GEO Startup Shut Down After Seven Months. What Its Postmortem Actually Argued.",
    h1="A GEO Startup Shut Down After Seven Months. <em>What Its Postmortem Actually Argued</em>",
    h1_plain="A GEO Startup Shut Down After Seven Months. What Its Postmortem Actually Argued.",
    subtitle="Lorelight reportedly closed after about seven months, with its founder arguing the specific problem it was built to solve did not need solving the way the company had assumed. That is worth taking seriously rather than dismissing.",
    meta_desc="A GEO tooling startup, Lorelight, reportedly shut down after roughly seven months. What its founder's postmortem argued about the category, and an honest look at what disclosed GEO research does and doesn't support.",
    og_desc="One startup's failure is not proof a category is broken, and it isn't proof the category works either. What a GEO startup's own shutdown postmortem argued, checked against the disclosed research rather than dismissed or accepted on faith.",
    ld_desc="An examination of a reported GEO tooling startup shutdown, Lorelight, its founder's stated postmortem reasoning, and an honest assessment of what disclosed GEO research actually supports and does not support.",
    keywords="geo startup shutdown, does geo tooling actually work, lorelight shutdown, geo tool postmortem, is geo worth it, ai visibility tool skepticism",
    about=["GEO Industry", "Startup Postmortem", "GEO Tooling Skepticism", "Methodology Transparency"],
    findings=[("~7", "months Lorelight reportedly operated before shutting down, per its founder's own public account"),
              ("<1%", "SparkToro's disclosed finding for how often the same AI platform repeats the same brand list on an identical repeated query"),
              ("0", "statistically significant citation lift Ahrefs' matched-control study found from adding schema markup alone"),
              ("$300M+", "disclosed venture funding raised across six GEO-native startups in under two years, the boom this one shutdown happened inside")],
    faq=[("What did Lorelight build, and why did it reportedly shut down?",
          "Lorelight was reported as a GEO tooling startup that operated for roughly seven months before closing. Its founder's own postmortem reportedly argued that the specific problem the company was built around did not need solving in the way the company had originally assumed. This account traces to the founder's own public statement, not an independently audited business record, and is presented here as one company's self-reported explanation, not a verified fact about the category."),
         ("Does one startup shutting down mean GEO tooling doesn't work?",
          "No, and treating it that way overreaches the evidence in the other direction. Six GEO-native startups have disclosed more than $300 million in combined venture funding in under two years, one reached a reported $1 billion valuation, and disclosed research from Ahrefs, Muck Rack and Search Engine Journal/Victorious independently finds real, measurable correlations between specific signals and AI citation. One company's shutdown is a data point about that company's specific bet, not a referendum on every tool in the category."),
         ("What does the disclosed research actually say GEO tooling can promise?",
          "Correlational evidence, mostly, and one important negative finding. Ahrefs' 75,000-brand study found real correlations between signals like YouTube mentions and branded web mentions and AI citation, but is explicit that this is correlation, not causation. A separate matched-control Ahrefs study found no statistically significant citation lift from adding schema markup alone, despite schema correlating with citation in raw data, because sites that add schema also tend to invest more broadly in their content. Neither finding is a guarantee, and no disclosed study in this category has produced a controlled, causal case study of a specific brand's citation rate moving by a specific, verified amount."),
         ("Should this postmortem make a buyer more skeptical of GEO tools generally?",
          "It is a reasonable prompt to be skeptical of any specific vendor's unverified case study, the kind with a large round percentage and no disclosed baseline or client name, which is a real and recurring pattern in this category's marketing. It is a less reasonable prompt to conclude the underlying measurement problem is fake, since SparkToro's own disclosed research shows the problem it points at, that AI answers are highly inconsistent run to run, is real and independently documented, which is itself an argument for disclosed, repeated measurement over any single vendor's claimed score.")],
    related=[("/bg-042.html", "BG-042", "The GEO Funding Boom, Mapped",
              "Six GEO-native startups, over $300 million raised, and one $1 billion valuation, the boom this shutdown happened inside."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "The measurement noise underneath this whole category, and what to ask any vendor about their own run-to-run consistency."),
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "The companion piece to this one: eight checklist items, each cited, and an explicit section on what the checklist cannot promise.")],
    cta_h="Judge this on your own disclosed number, not a vendor's case study",
    cta_p="Skepticism of vague case studies is fair. The answer isn't to trust ours either, it's to check your own brand against real prompts and see the method, free, on your own domain.",
    body="""  <p>A GEO tooling startup called Lorelight reportedly shut down in 2026 after roughly seven months of operation. Its founder's postmortem reportedly argued that the specific problem the company had built itself around did not need solving in the way the company originally assumed. That is a genuinely uncomfortable thing for anyone else in this category to sit with, including a company writing about it on its own research blog, and the honest response is to actually sit with it rather than wave it away.</p>

  <div class="callout">
    <div class="callout-label">How this was researched, and what it cannot tell you</div>
    <p>What is known about Lorelight here comes from the founder's own public account of the shutdown, a self-reported postmortem, not an independently audited financial record or a verified third-party report. This piece paraphrases the argument rather than quoting it directly, and does not treat the account as settled fact about the company's internal decisions. What it does treat as settled, because it traces to separately disclosed, sourced research, is the state of the broader evidence about whether GEO measurement and tooling produce anything real, covered below with its own citations.</p>
  </div>

  <h2>The failure and the funding boom happened at the same time</h2>

  <p>Lorelight's reported shutdown is not the category's only recent data point. Six GEO-native startups have disclosed more than <strong>$300 million</strong> in combined venture funding in under two years, and Profound reached a reported $1 billion valuation off a $96 million Series C in February 2026, making it the category's first reported unicorn. <a href="/bg-042.html">The full funding picture is mapped separately</a>, and it is worth holding both facts at once: a well-funded category can still contain individual failures, and an individual failure inside a well-funded category is not automatically proof the category itself is a mirage. Startups fail for company-specific reasons, timing, execution, a wrong bet on which exact problem mattered, constantly, in categories that go on to be real markets anyway.</p>

  <h2>What the disclosed research actually supports</h2>

  <p>Setting aside any one company's self-reported account, here is what independently disclosed research in this category has actually found. Ahrefs' 75,000-brand correlation study found real, measurable relationships between signals like YouTube mentions and branded web mentions and AI citation across ChatGPT, Google AI Mode and Google AI Overviews, and states plainly that this is correlation, not causation. Muck Rack's 25-million-link study found earned media accounts for 84% of AI citations, a stable finding across three editions since mid-2025. Search Engine Journal and Victorious's 175-brand study found a large gap between recognition (96% of brands described accurately when asked about directly) and citation (89% of brands never appearing in category-research answers at all), which is itself a specific, checkable, disclosed finding, not a vague claim.</p>

  <h2>What the disclosed research does not support</h2>

  <p>It is just as important to name where the evidence runs out. A separate, matched-control Ahrefs study of 1,885 pages that added JSON-LD schema found no statistically significant citation increase on any of the three platforms tested, despite schema correlating with citation in raw, unmatched data, because sites that bother adding schema also tend to invest more broadly in technical SEO and content quality. That is a genuine myth-bust against a claim ("add schema, get cited") that circulates constantly in this category's own marketing. And SparkToro's disclosed study of 2,961 queries found less than a 1-in-100 chance that the same AI platform, asked the same question twice, returns the same brand list at all, which is a real, independently documented reason to be skeptical of any single "visibility score" presented as a stable fact rather than one noisy sample.</p>

  <p>No disclosed study in this category, this piece included, has produced a controlled, causal case study of a real brand's citation rate moving by a specific, independently verified amount as a result of a specific change. That gap is worth naming directly rather than filling it with an unverifiable vendor claim of the "340% in 90 days" variety that shows up constantly in this space with no client name and no disclosed baseline attached.</p>

  <h2>What this means, honestly</h2>

  <p>If Lorelight's founder argued the problem their specific product targeted did not need solving the way they assumed, that is a claim about one company's specific framing of one specific problem, not a claim that AI citation measurement, brand mention tracking, or GEO content strategy have no basis. The disclosed research above shows real correlations and one real, useful negative finding. It does not show a guaranteed formula, and nothing in this category, including BrandGEO's own published research, should be read as claiming otherwise.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>One startup's shutdown is real, uncomfortable, and worth taking seriously, not dismissing as noise. It is also not proof the underlying measurement problem is fake, since separately disclosed research keeps finding real, checkable signal underneath it. The honest position sits between blind boosterism and blanket dismissal: some of this works, none of it is guaranteed, and any claim that skips past that distinction is the one actually worth being skeptical of.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-065
ARTICLES.append(dict(
    slug="bg-065", bid="BG-065", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Myth-Bust", "Technical GEO", "AI Crawlers"],
    title="Does Llms.txt Actually Help You Get Cited? The Adoption Data Says Not Yet",
    h1="Does Llms.txt Actually Help You Get Cited? <em>The Adoption Data Says Not Yet</em>",
    h1_plain="Does Llms.txt Actually Help You Get Cited? The Adoption Data Says Not Yet",
    subtitle="A file that reportedly sits on somewhere between 9 and 16% of tracked sites, with no shown link between having one and getting cited more, largely because the major crawlers do not reliably fetch it yet.",
    meta_desc="Llms.txt adoption is reportedly stuck near 9-16% of tracked sites in 2026, and no disclosed study links having one to more AI citations. Here is what the file actually does, and why treating it as mandatory is premature.",
    og_desc="A generic GEO checklist item, restated: add an llms.txt file. The adoption numbers say most sites still haven't, and nobody has shown it moves your citation rate. Here is the honest version.",
    ld_desc="An assessment of llms.txt adoption and its unproven relationship to AI citation, covering what the file is designed to do, why major AI crawlers largely do not fetch it, and a grounded recommendation.",
    keywords="llms.txt adoption, does llms.txt help ai citations, do you need an llms.txt file, llms.txt 2026, what is llms.txt for",
    about=["Technical Generative Engine Optimization", "AI Crawler Behavior", "Content Strategy", "Methodology Transparency"],
    findings=[("9-16%", "the range of tracked-site adoption reported for llms.txt as of mid-2026, treated here as an undisclosed-methodology tracker estimate, not a verified census"),
              ("0", "disclosed, matched-control studies found in this research pass showing a citation lift specifically attributable to having an llms.txt file"),
              ("Undisclosed", "whether GPTBot, Google-Extended, PerplexityBot or ClaudeBot reliably fetch and use llms.txt; none of the major AI companies has published a statement that they do"),
              ("2024", "the year the llms.txt proposal was first published, by Jeremy Howard of Answer.AI, as a suggested standard rather than one adopted by any platform")],
    faq=[("What is llms.txt supposed to do?",
          "It is a proposed plain-text file, served at a site's root, that gives a condensed, curated summary of a site's most important pages in a format meant to be easier for a language model to parse than a full HTML crawl. It was proposed in 2024 as a suggested standard, similar in spirit to robots.txt or sitemap.xml, but it has no equivalent formal adoption by any search or AI company."),
         ("Does having an llms.txt file get you cited more by ChatGPT, Gemini, Claude or Perplexity?",
          "No disclosed study found in this research pass shows that it does. Adoption trackers report the file sitting on a minority of sites, commonly cited in the 9 to 16% range, and no matched-control test comparable to the schema-markup study covered in BG-038 has isolated a citation effect from adding one."),
         ("Why doesn't llms.txt work the way robots.txt does?",
          "Robots.txt is honored by crawlers because search engines built compliance into their own crawling infrastructure decades ago and it became an enforced norm. Llms.txt has no equivalent commitment from OpenAI, Google, Anthropic or Perplexity; none of the major AI companies has published a statement that its crawlers fetch or parse the file, which is the structural reason adoption has not translated into a measured effect."),
         ("Should I remove my llms.txt file if I already have one?",
          "No. There is no shown harm in keeping it, and if crawler support improves later, sites that already have a maintained file are positioned to benefit immediately. The correction here is about priority, not about undoing the file: it should not be the first thing a resource-constrained team spends time on ahead of items with disclosed evidence behind them, like the earned-media finding in BG-035 or the freshness cadence in BG-069.")],
    related=[_R_038, _R_040, _R_044],
    cta_h="Check what's actually driving your citations", cta_p="Run your domain through the seven engines we track and see real answers, not a checklist score. No signup, no card, about a minute.",
    body="""  <p>Llms.txt shows up on most GEO checklists published in 2026, usually phrased as a quiet imperative: add one, it's easy, it can't hurt. The second half of that claim is probably true. The first half, that it does something measurable for AI citation, is not shown by any disclosed study found in this research pass, and the adoption numbers on the file itself suggest most sites have already made the same call by simply not getting around to it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece draws on publicly available llms.txt adoption trackers, which scan a sample of sites for the presence of a <code>/llms.txt</code> file and report the share found. These trackers do not disclose a full methodology, a fixed sample size, or a consistent date range in the way the studies covered in <a href="/bg-035.html">BG-035</a> do, so every adoption figure below is labeled as an undisclosed-methodology estimate, not a verified census. No disclosed, matched-control study measuring a citation effect from adding llms.txt was located in this pass; that absence is reported directly rather than filled in with an inferred number.</p>
  </div>

  <h2>What llms.txt actually is</h2>

  <p>Jeremy Howard of Answer.AI proposed llms.txt in 2024 as a plain-text file served at a site's root, meant to give a language model a condensed map of a site's most important content, similar in spirit to how a sitemap gives a search engine a map of a site's pages. The pitch made sense on paper: language models have limited context windows and struggle to parse full HTML pages efficiently, so a curated, markdown-style summary should in theory be easier to ingest than crawling and rendering an entire site.</p>

  <p>The proposal was never adopted as a formal standard by any search engine or AI company. It is closer to a suggested convention than an enforced protocol, and that distinction matters more than it might first appear.</p>

  <h2>Why adoption has stalled in the 9 to 16% range</h2>

  <p>Adoption trackers checking for the presence of an llms.txt file across sampled sites report figures in roughly the 9 to 16% range as of mid-2026, depending on which tracker and which sample. Treat that range as directional rather than precise: none of the trackers producing these numbers discloses a full sample size, a consistent crawl date, or a stated methodology for how sites were selected, which is the same gap this site has flagged repeatedly on other undisclosed GEO statistics, most recently in <a href="/bg-038.html">BG-038's review of six repeated citation claims</a>.</p>

  <p>What is more defensible than the exact percentage is the reason adoption plateaued rather than climbing toward the near-universal rate something like a sitemap eventually reached. Robots.txt and sitemaps became near-universal because the search engines that read them built compliance into their own crawling infrastructure and made the incentive concrete: follow the convention, get crawled correctly. Llms.txt has no equivalent commitment on the other side. None of OpenAI, Google, Anthropic or Perplexity has published a statement confirming that its crawlers, whether GPTBot, Google-Extended, ClaudeBot or PerplexityBot, actually fetch and parse an llms.txt file when one exists. Without that confirmation, a site adding the file is making an investment against an unconfirmed reader.</p>

  <h2>Why no correlation has been shown, and why that's different from a negative finding</h2>

  <p>It is worth being precise about what "no shown correlation" means here, because it is a weaker and more honest claim than "llms.txt doesn't work." The schema-markup claim covered in <a href="/bg-038.html">BG-038</a> was tested directly: Ahrefs matched 1,885 pages that added JSON-LD schema against control pages and measured no statistically significant citation lift, a genuine negative finding from a genuine experiment. Llms.txt has not been through an equivalent test in any study this research pass could locate. The honest state of the evidence is an absence, not a disproof. Nobody has run the matched-control study that would settle this, in either direction, and the plausible reason nobody has is that crawler support is itself unconfirmed, which makes any citation effect that did appear hard to attribute specifically to the file rather than to whatever else a site publishing an llms.txt file is probably also doing well.</p>

  <p>That last point cuts the same way the schema finding did: sites disciplined enough to publish a maintained llms.txt file are very likely also disciplined about clear structure, up-to-date content, and clean information architecture generally, exactly the kind of site an engine like <a href="/bg-044.html">Perplexity's retrieval pipeline or Gemini's grounding search</a> would tend to surface regardless of the file's presence. A raw correlation, if one turned up in future research, would risk the identical confound Ahrefs already documented for schema.</p>

  <h2>The case for adding one anyway, stated fairly</h2>

  <p>None of this is an argument to actively avoid llms.txt. The file costs little to produce for a site that already maintains a clear content structure, and if crawler support does firm up later, an existing well-maintained file means a site is already positioned rather than starting from zero. The honest version of the recommendation is about sequencing: for a team with limited time, this is not the item to reach for first, ahead of things with actual disclosed evidence behind them, like earning third-party coverage (the largest single factor in <a href="/bg-035.html">Muck Rack's 25-million-link study</a>) or maintaining update cadence on already-cited pages, covered in full in <a href="/bg-069.html">our companion piece on content freshness</a>.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Llms.txt is a reasonable bet on a convention that might matter later, not a lever with a shown effect today. Treat it as low-cost, low-priority hygiene, not as the item that moves your citation rate. The GEO checklists that present it as mandatory are stating more certainty than the current evidence supports, which is the same pattern this site has flagged on other repeated claims.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-066
ARTICLES.append(dict(
    slug="bg-066", bid="BG-066", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Myth-Bust", "AI Citation", "Content Strategy"],
    title="The Backlinks-Do-Not-Matter-for-AI-Citation Claim Is Not as Settled as It Sounds",
    h1="\"Backlinks Don't Matter for AI Search, Only Mentions Do.\" <em>That's Not What the Data Shows</em>",
    h1_plain="The Backlinks-Do-Not-Matter-for-AI-Citation Claim Is Not as Settled as It Sounds",
    subtitle="A tidy line repeats across GEO content: forget links, mentions are what count now. The two disclosed studies that actually measured it did not fully agree, and neither ruled out an indirect path from links to citation.",
    meta_desc="Does backlinks vs mentions for AI search have a settled answer? The two disclosed studies that measured it, Ahrefs and Search Engine Journal/Victorious, don't fully agree, and neither tested the indirect path.",
    og_desc="Backlinks don't matter for AI search anymore, only mentions do. That line is repeated constantly. The two studies that actually measured it disagree with each other, and neither one settled the question.",
    ld_desc="An examination of the claim that backlinks no longer matter for AI citation while brand mentions do, comparing Ahrefs' and Search Engine Journal/Victorious's disclosed correlation studies and naming what remains untested.",
    keywords="do backlinks matter for AI search, backlinks vs mentions GEO, do backlinks help AI citation, links vs mentions AI search 2026",
    about=["Generative Engine Optimization", "AI Citation Research", "Content Strategy", "Methodology Transparency"],
    findings=[("Weak", "the correlation Ahrefs found between raw backlink count and AI citation across ChatGPT, AI Mode and AI Overviews, the weakest of the signals it tested"),
              ("0.49", "the moderate correlation Search Engine Journal and Victorious found between referring domains and AI mention rate, a different result from a different study"),
              ("0", "studies located in this research pass that isolated whether backlinks help citation directly or only help a page get indexed and read in the first place"),
              ("2", "disclosed studies exist on this question, and they disagree with each other closely enough that neither should be read as the final word")],
    faq=[("Do backlinks matter for getting cited by AI engines?",
          "It's genuinely unresolved. Ahrefs found raw backlink count correlates weakly with citation across the three engines it tested. Search Engine Journal and Victorious found a moderate 0.49 correlation between referring domains and AI mention rate. Both are real, disclosed findings, and they point in different directions on how much backlinks matter, which is why this question is not settled."),
         ("If mentions correlate more strongly than backlinks, doesn't that prove backlinks don't matter?",
          "No. A stronger correlation for one signal doesn't disprove a weaker but real effect from another, and neither study tested whether backlinks matter indirectly, by helping a page get crawled, indexed, and read by an AI system in the first place, which is a separate and upstream question from direct citation weighting."),
         ("Why do so many GEO articles state flatly that backlinks don't matter anymore?",
          "Because a correlational finding that backlinks matter less than mentions gets compressed, somewhere between the first and the tenth blog post repeating it, into backlinks don't matter at all. That flattening pattern is the same one covered across six other claims in BG-038, and it's worth watching for whenever a nuanced correlation gets restated as a flat rule."),
         ("What should a content team actually do about backlinks given this uncertainty?",
          "Don't abandon a link-building program on the strength of an unsettled claim, and don't treat it as the top GEO priority either. The strongest disclosed factor found across the research this site has reviewed is earned media and third-party mentions generally, covered in BG-035, which links overlap with but are not identical to.")],
    related=[_R_035, _R_038, _R_044],
    cta_h="See what's actually citing you, not what should be", cta_p="Run your domain through the engines we track and see the real sources behind your mentions, on screen, in about a minute. No signup, no card.",
    body="""  <p>"Backlinks don't matter for AI search, only mentions do" is one of the tidiest lines in GEO content, and it shows up constantly, usually stated with no hedge and no citation. It is a compressed version of something real, but the compression drops the part that actually mattered. The honest state of the research is that this question is unresolved, and the two disclosed studies that measured it did not agree closely enough with each other for anyone to call it settled in either direction.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece is a synthesis of two disclosed-methodology correlation studies already covered on this site: Ahrefs' 75,000-brand Spearman correlation analysis across ChatGPT, Google AI Mode and Google AI Overviews, and Search Engine Journal and Victorious's 175-brand, 8-platform study, both detailed in full in <a href="/bg-035.html">BG-035</a> and referenced again in <a href="/bg-038.html">BG-038</a>. No new data was collected for this piece; it exists to correct a flattened version of a claim that both of those articles already state more carefully than most of the content repeating it does.</p>
  </div>

  <h2>What the two disclosed studies actually found</h2>

  <p>Ahrefs' correlation study ran a Spearman analysis across 75,000 brands and found that raw backlink count correlated weakly with citation across all three engines it tested, the weakest of the named signals in its table, behind YouTube mentions, branded web mentions, branded anchor text, and even branded search volume.</p>

  <p>Search Engine Journal and Victorious's separate 175-brand study measured something adjacent but not identical: correlation between referring domains and AI mention rate, which came out at a moderate 0.49, close in size to the 0.45 it found for third-party web mentions generally. That is a materially different result from Ahrefs', not because one study is wrong, but because they used different cohorts, different platforms, and slightly different definitions of the signal being measured. "Backlinks" in Ahrefs' table means raw count. "Referring domains" in the Victorious study is a related but distinct metric. Treating the two studies as interchangeable evidence for the same claim is itself part of how the flattened version of this claim gets repeated with more confidence than either study alone supports.</p>

  <h2>What "mentions matter more" doesn't prove</h2>

  <p>Both studies are consistent on one point: brand mentions and third-party coverage generally correlate more strongly with citation than backlinks do. That is a real and useful finding, and it's the reason earned media sits at the top of the checklist in <a href="/bg-054.html">BG-054</a> and drives the largest share of citations by a wide margin in <a href="/bg-035.html">Muck Rack's 25-million-link study</a>. But a stronger correlation for one signal is not evidence that a weaker signal has zero effect. Ahrefs' own finding was "weak," not "zero," and a weak but nonzero effect across 75,000 brands is still a real relationship, just a smaller one than the mentions story.</p>

  <p>The bigger gap in the record is what neither study tested at all: whether backlinks matter indirectly. A backlink helps a page get crawled, indexed, and generally read by search infrastructure in the first place, which is upstream of being citable by an AI system that draws on that same indexed web. Neither Ahrefs nor the Victorious study isolated that causal chain. It's entirely possible for backlinks to matter for AI citation not because an engine directly weights link count the way a 2010s-era Google algorithm did, but because a poorly linked page is less likely to be discovered, crawled, and available to be cited at all. No disclosed study in this research pass separated "backlinks help citation directly" from "backlinks help a page exist inside the system that produces citation," and until one does, the direct-effect question stays open precisely because the indirect-effect question was never asked.</p>

  <h2>Why this gets flattened into a flat rule anyway</h2>

  <p>The pattern here matches the one described across six other repeated claims in <a href="/bg-038.html">BG-038</a>: a real, hedged, correlational finding gets summarized by someone who drops the hedge, and the flattened version gets repeated by people who never read the original study. "Weak correlation, and mentions correlate more strongly" is accurate and boring. "Backlinks don't matter anymore" is a better headline and a worse description of what was actually measured.</p>

  <h2>What to actually do with an unresolved question</h2>

  <p>Don't cancel a link-building program on the strength of a claim that isn't settled, and don't treat backlinks as a top GEO priority either. The two disclosed studies agree that mentions and third-party coverage generally correlate harder with citation than links specifically do, so that's where the marginal hour is better spent. But calling the backlinks question closed, in either direction, is reading more certainty into two studies that disagree with each other than either one actually supports.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Mentions correlate more strongly than backlinks in both disclosed studies that measured it, and that's worth acting on. "Backlinks don't matter" is a different and stronger claim than either study made, and the indirect path through indexing and crawling was never tested at all. Open question, not a closed one.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-067
ARTICLES.append(dict(
    slug="bg-067", bid="BG-067", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Industry Commentary", "GEO vs SEO", "Content Strategy"],
    title="The GEO vs SEO Debate Is Not as Settled as the Clarity Pieces Claim",
    h1="The GEO vs SEO Debate Keeps Getting Declared Over. <em>It Keeps Coming Back</em>",
    h1_plain="The GEO vs SEO Debate Is Not as Settled as the Clarity Pieces Claim",
    subtitle="Several 2026 industry pieces have tried to close the GEO-vs-SEO argument with a tidy both-required framing. That framing settles the terminology question and skips the real one: tooling, budget lines, and KPIs.",
    meta_desc="Is GEO just SEO, or a separate discipline? 2026 clarity pieces keep declaring the debate resolved with a both-required framing. Here is why that resolution avoids the actual disagreement: tooling, budget, and KPIs.",
    og_desc="A wave of 2026 pieces has tried to close the GEO-vs-SEO debate with the same tidy line: both required, not either/or. That line resolves the vocabulary fight and quietly skips the budget-line fight underneath it.",
    ld_desc="An analysis of why the recurring GEO-versus-SEO terminology debate has not actually been resolved by 2026 clarity pieces, distinguishing the settled definitional question from the unsettled operational one.",
    keywords="geo vs seo debate 2026, is geo just seo, GEO SEO terminology, GEO separate discipline",
    about=["Generative Engine Optimization", "Industry Commentary", "Content Strategy", "SEO"],
    findings=[("2+", "years the GEO-versus-SEO terminology argument has recurred in industry commentary without a single resolution sticking"),
              ("3", "genuinely separate questions this debate usually collapses into one: is GEO a real discipline, does it need distinct tooling, and does it need a distinct budget line"),
              ("8", "legacy SEO platforms this site already checked, per BG-040, and found none built dedicated AI-answer infrastructure from scratch, evidence for the skeptical side of this debate"),
              ("0", "industry consensus pieces found in this research pass that actually resolved the budget-line and KPI questions, as opposed to the vocabulary question alone")],
    faq=[("Is the GEO vs SEO debate actually settled in 2026?",
          "The vocabulary question is close to settled: most serious commentary agrees GEO and SEO are not either/or and both matter for a brand's overall discoverability. The operational question underneath it, whether GEO needs distinct tooling, a distinct budget line, and distinct KPIs from traditional SEO, is not settled and keeps resurfacing in different framing every few months."),
         ("Why does this debate keep coming back if it's supposedly resolved?",
          "Because the pieces that declare it resolved usually resolve the easier, definitional layer (is GEO real, is it worth doing) and leave the harder, operational layer (how do you budget for it, measure it, and tool for it separately from SEO) untouched. A definitional consensus doesn't settle a budgeting or org-chart disagreement, so the argument resurfaces whenever someone hits the unresolved layer."),
         ("Is GEO just SEO with new vocabulary?",
          "There's a real case for both positions and this site has not adjudicated it, deliberately. What this piece checked and can say with evidence: of eight legacy SEO platforms audited in BG-040, none built dedicated, from-scratch prompt-and-response infrastructure the way GEO-native startups did, which supports the skeptical view. But GEO-native vendors raising over $300M in venture funding in under two years, per the same research pass, is real market evidence that a meaningful number of buyers and investors treat it as a distinct discipline worth paying for separately."),
         ("What should a marketing team actually do given the debate isn't settled?",
          "Don't wait for the industry to agree before acting. The practical question that matters for a given team is narrower than the industry-wide debate: does tracking and improving AI-engine visibility require different measurement than your existing SEO stack provides. For most teams the honest answer is yes, at least on measurement, regardless of which side of the terminology argument they land on.")],
    related=[_R_040, _R_038, _R_044],
    cta_h="Skip the terminology argument", cta_p="Whatever you call it, see how the seven major AI engines actually answer about your brand right now. No signup, no card, about a minute.",
    body="""  <p>Every few months, a new piece runs some version of the headline "let's finally clear up GEO versus SEO," lays out a tidy resolution, usually "both are required, it's not either/or," and the industry nods along for a while before the argument resurfaces somewhere else with a different framing. This has now happened often enough, across enough separate 2026 pieces, that the recurrence itself is worth examining rather than the latest resolution attempt on its own terms.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a commentary and synthesis piece, not a new data study. It draws on the disclosed audit of eight legacy SEO platforms' AI-visibility features already published in <a href="/bg-040.html">BG-040</a>, plus general observation of how the GEO-versus-SEO framing has recurred across industry commentary through 2026. Where a specific claim about industry sentiment is not traceable to one citable source, it is flagged as a recurring pattern rather than attributed to a single named piece.</p>
  </div>

  <h2>What the "clarity" pieces actually resolve</h2>

  <p>Pieces that set out to settle the GEO-versus-SEO argument tend to land on a version of the same line: they're not competitors, GEO doesn't replace SEO, both are needed, and framing them as either/or is a false choice. That's a reasonable claim and it isn't really controversial. Almost nobody serious argues a brand should abandon traditional search optimization entirely in favor of chasing AI citations, and almost nobody serious argues AI visibility is a fad not worth any attention. The both-required framing wins the argument because the argument, stated that narrowly, was never that contested to begin with.</p>

  <p>What that framing does not resolve, and rarely even attempts to, is the operational question underneath the terminology fight. Is GEO a genuinely distinct discipline requiring its own tooling, or is it a feature bolted onto an SEO platform's existing infrastructure? Does it deserve its own budget line, or is it a subset of an existing SEO or content marketing budget? Does it need its own KPIs, separate from organic traffic and keyword rank, or can it be folded into the same reporting a team already produces? Those are three separate, answerable, and currently unanswered questions, and "GEO and SEO both matter" is compatible with any answer to all three.</p>

  <h2>The evidence that actually bears on the harder questions</h2>

  <p>Some of what's needed to answer the operational questions does exist, and it points in different directions depending on which lens you use. On the tooling question, <a href="/bg-040.html">this site's own audit of eight legacy SEO platforms</a>, Semrush, Ahrefs, Conductor, seoClarity, Search Atlas, Nightwatch, SE Ranking, and Advanced Web Ranking, found that not one of them built a dedicated, from-scratch prompt-and-response infrastructure the way GEO-native startups like Profound or Peec AI did. Every one of them extended an existing keyword database or SERP-scraping pipeline to also capture AI answers. That's real evidence for the "it's SEO with a new module" reading of the debate.</p>

  <p>But the same research pass found the opposite signal on the market side: GEO-native vendors that built separate products from scratch raised over $300 million in venture funding in under two years, with Profound reaching a $1 billion valuation, funding levels that suggest a meaningful number of sophisticated investors and buyers treat this as a genuinely distinct category worth a separate line item, not a feature of an existing one. Both facts are true simultaneously, and they point in different directions, which is itself the honest state of the evidence rather than a contradiction to be explained away.</p>

  <h2>Why the debate keeps recurring instead of staying settled</h2>

  <p>A definitional consensus does not settle a budgeting disagreement, and a budgeting disagreement does not settle a KPI disagreement. Each time a "clarity" piece resolves the easy layer, teams still have to separately decide whether to buy a dedicated tool or extend an existing subscription, whether to report AI citation rate to leadership as its own metric or fold it into an existing traffic dashboard, and whether the person doing this work is an SEO specialist with an added responsibility or a distinct hire. None of those decisions gets easier just because everyone agrees GEO and SEO are complementary. The debate resurfaces because the follow-on questions were never actually part of what got resolved, even though the framing implies they were.</p>

  <h2>What this means in practice, deliberately unresolved</h2>

  <p>This piece is not going to adjudicate whether GEO deserves its own budget line at your organization specifically, because that answer depends on team size, existing tooling, and how much AI-referred traffic already matters to the business, none of which is knowable from an industry-wide framing. What is worth taking from this is narrower and more useful: the next time a piece declares this debate resolved, check which layer it actually resolved. If it settled the vocabulary question and called it a day, the harder questions are still open, and treating them as closed because the easy one got closed is a mistake worth avoiding.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>The vocabulary fight is close to over. The tooling, budget, and KPI fight underneath it is not, and conflating the two is exactly why this debate keeps getting declared settled and keeps coming back anyway.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-068
ARTICLES.append(dict(
    slug="bg-068", bid="BG-068", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Myth-Bust", "AI Citation", "Original Research"],
    title="The Schema Markup Debate: Vendor Claims vs the One Study That Actually Tested It",
    h1="Schema Markup Gets You a 44% Citation Lift, Some Vendors Claim. <em>One Study Tested It and Found Nothing</em>",
    h1_plain="The Schema Markup Debate: Vendor Claims vs the One Study That Actually Tested It",
    subtitle="A vendor-circulated number promises a large citation lift from structured data. A matched-control test of 1,885 pages found no statistically significant increase on any platform, and one platform's citations fell.",
    meta_desc="Does structured data help AI search? Vendor claims cite large citation lifts from schema markup. Ahrefs' matched-control test of 1,885 pages found no statistically significant increase, and AI Overviews citations fell 4.6%.",
    og_desc="A vendor number says schema markup delivers a big citation lift. A matched-control test of 1,885 real pages found no statistically significant increase on any platform tested, and one platform actually fell.",
    ld_desc="A comparison of vendor-circulated claims about schema markup's effect on AI citation against Ahrefs' matched-control study of 1,885 pages, with an explanation of the confound behind the raw correlation and a grounded recommendation.",
    keywords="schema markup ai citation study, does structured data help ai search, does schema help chatgpt citations, JSON-LD AI search",
    about=["Generative Engine Optimization", "AI Citation Research", "Methodology Transparency", "Original Research Synthesis"],
    findings=[("0%", "statistically significant citation lift Ahrefs measured from adding JSON-LD schema, across a matched-control test of 1,885 pages"),
              ("-4.6%", "the change in Google AI Overviews citations after adding schema, the one platform where the result was statistically significant, in the wrong direction"),
              ("~3x", "how much more likely an AI-cited page was to already carry schema versus an uncited page, in a separate 6-million-URL pass, the correlation the vendor claim likely traces back to"),
              ("Undisclosed", "the sample size, date range, and method behind the circulating vendor claim of a roughly 44% citation lift from structured data and FAQ schema")],
    faq=[("Does adding schema markup get a brand cited more by AI engines?",
          "No causal lift was found in the one matched-control study that tested it directly. Ahrefs tracked 1,885 pages that added JSON-LD schema between August 2025 and March 2026, matched each against control pages with similar existing citation levels, and measured no statistically significant citation increase on Google AI Overviews, AI Mode, or ChatGPT. AI Overviews citations actually fell 4.6%, a result significant in the wrong direction."),
         ("Where does the vendor claim of a large citation lift from schema come from?",
          "It traces to GEO-vendor blog content with no named study, no disclosed sample size, and no stated date range behind the specific figure, covered in more detail in BG-038. The number should be treated as widely repeated, not independently verified."),
         ("If a matched-control test found no effect, why do AI-cited pages carry schema so much more often?",
          "Because the raw correlation is confounded. In a separate 6-million-URL pass, Ahrefs found AI-cited pages were roughly three times more likely to already carry schema than uncited pages, but its own conclusion is that sites disciplined enough to add structured data also tend to invest more broadly in content quality, technical SEO, and link building. Schema is a marker of a well-run site, not a proven cause of citation."),
         ("Should I stop adding schema markup to my site given this finding?",
          "Not necessarily. There's no shown harm in adding it, and it may still help other things, like search-result rich snippets, that a citation study wasn't measuring. The correction here is narrower: don't add schema expecting it to move your AI citation rate, and don't let a vendor's undisclosed number set that expectation for you.")],
    related=[_R_038, _R_035, _R_040],
    cta_h="See what's actually cited, not what should be", cta_p="Run your domain through the seven engines we track and see the real answer, not a vendor promise. No signup, no card, about a minute.",
    body="""  <p>A number circulates through GEO-vendor content that puts a precise figure, commonly stated near a 44% citation lift, on what adding structured data and FAQ schema does for AI citation. It's stated with confidence and no source. The one study in this category built specifically to test causation, not just correlation, found the opposite of what that number implies: no statistically significant lift on any platform tested, and a fall on the platform where the result was significant at all.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece compares an undisclosed-methodology vendor claim, which recurs across GEO-vendor blogs with no named study, no stated sample size, and no date range attached, against Ahrefs' matched-control schema study, already covered in full in <a href="/bg-038.html">BG-038</a>. Ahrefs tracked 1,885 pages that added JSON-LD schema between August 2025 and March 2026, matched each against three control pages from different domains with similar existing citation levels that did not add schema, and measured citation-count change across Google AI Overviews, Google AI Mode, and ChatGPT. That is a disclosed method with a stated sample and date range, which is why it is treated here as the evidence of record rather than one input among several equally weighted claims.</p>
  </div>

  <h2>The vendor claim, stated plainly</h2>

  <p>The figure that circulates most often lands near a 40 to 44% weighting or lift attributed to FAQ schema and inline citations in how an engine like ChatGPT selects sources. It shows up phrased slightly differently across different vendor blogs, which is itself a signal: a number that's genuinely measured tends to get repeated with the same precision and the same caveats every time, because everyone is citing the same study. A number that's really a plausible-sounding estimate passed from one summary to the next tends to drift slightly in each retelling, and this one does. No source located in this research pass could trace the figure back to a named study with a disclosed sample.</p>

  <h2>What the matched-control study actually did</h2>

  <p>Ahrefs' study is built to answer a harder and more useful question than "do AI-cited pages tend to have schema." It set out to isolate whether adding schema causes a citation increase, by tracking pages that made the change and comparing each one against matched control pages that didn't, rather than just comparing cited pages to uncited pages in one snapshot. That control-group design is what makes it possible to say something about cause rather than just correlation.</p>

  <p>The result: no statistically significant citation increase on any of the three platforms tested. AI Mode was up 2.4% and ChatGPT up 2.2%, neither reaching significance. AI Overviews citations fell 4.6%, the one result that was statistically significant, and it moved in the direction opposite to what the vendor claim would predict.</p>

  <h2>Why the raw correlation looks so different from the controlled result</h2>

  <p>The confusing part, and probably the real source of the vendor claim in the first place, is that schema does correlate with citation in raw, uncontrolled data. In a separate 6-million-URL pass, Ahrefs found AI-cited pages were nearly three times more likely to already carry JSON-LD schema than uncited pages. Read on its own, without the matched-control result next to it, that looks like strong evidence schema helps.</p>

  <p>Ahrefs' own explanation for the gap is a straightforward confound: sites disciplined enough to implement structured data correctly also tend to invest more broadly in the things that plausibly do drive citation, better content, cleaner technical SEO, more link building, more consistent publishing. Schema functions as a marker of a well-run, well-resourced site, not as a cause of citation in its own right. This is the exact pattern this site flagged as the underlying mechanism behind several other overstated GEO claims in <a href="/bg-038.html">BG-038</a>: a real correlation gets summarized by someone who drops the confound, and the summary gets repeated by people who never saw the control-group result.</p>

  <h2>What a vendor might have measured to arrive at a lift number</h2>

  <p>It's worth being fair about how a vendor could report a positive lift in good faith without a matched-control design. A before-and-after measurement on a single site or a small client set, with no control group, will pick up exactly the confound described above: the site added schema around the same time it also improved its content and earned more coverage, and all of that gets credited to the schema change alone because it's the change that was tracked. Selection bias compounds it further if the vendor is reporting results from clients who opted into a broader GEO engagement, not from schema in isolation. None of that requires bad faith, just a weaker research design than a matched-control test, and weaker research designs reliably produce larger, more flattering effect sizes than controlled ones do.</p>

  <h2>A grounded recommendation</h2>

  <p>Don't add schema markup expecting it to move your AI citation rate, and don't treat a vendor's uncited lift figure as a reason to prioritize it over items with actual disclosed evidence, like the earned-media finding covered in <a href="/bg-035.html">BG-035</a>. At the same time, there's no shown harm in keeping schema you already have, and it may still serve purposes a citation study wasn't measuring, like traditional search rich snippets. The correction here is about what schema is proven to do, not a case for removing it.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>One side of this debate has a name, a sample size, and a control group. The other side has a round number and no visible source. When those two things disagree, believe the one that discloses its method, and treat the other as marketing until it does the same.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-069
ARTICLES.append(dict(
    slug="bg-069", bid="BG-069", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Content Strategy", "AI Citation Research", "How To"],
    title="Your Evergreen Content Is Losing AI Citations. Freshness Is Why",
    h1="Your \"Evergreen\" Page Might Be Losing AI Citations. <em>Here's the Freshness Data</em>",
    h1_plain="Your Evergreen Content Is Losing AI Citations. Freshness Is Why",
    subtitle="A large share of AI citations trace to pages updated within the past year, but the same research shows the pages that hold their citation over months are moderately fresh, not maximally fresh. Reconciling the two changes what to actually do.",
    meta_desc="Content freshness and AI citations in 2026: 75% of cited pages were updated within the past year, but sustained citation tracks moderate freshness, not maximum freshness. A practical update cadence, explained.",
    og_desc="Never-touched evergreen content is a real citation risk. But the research also shows the fix isn't republishing constantly, sustained citation tracks moderately fresh pages, not the freshest ones. Both things are true.",
    ld_desc="An analysis of how content freshness relates to sustained AI citation, reconciling high update-recency among cited pages with evidence that sustained citation tracks moderate rather than maximum freshness, and a practical cadence recommendation.",
    keywords="content freshness ai citations 2026, how often update content for ai search, evergreen content ai search, content update cadence GEO",
    about=["Content Strategy", "AI Citation Research", "Generative Engine Optimization", "Content Freshness"],
    findings=[("75%", "of cited pages in Seer Interactive's study were updated within the last year, and content older than three years barely gets cited at all"),
              ("72%", "of citations looked fresh by last-modified date, but only 42% of those pages were originally published within the past year, meaning most freshness is edits, not new content"),
              ("6 months", "the median content age of pages cited consistently across a four-month window, versus 2 months for pages that got only a single spike citation"),
              ("78% vs 65%", "Gemini's share of citations updated within a year versus Perplexity's, the lowest of the three engines Seer tested, despite Perplexity's real-time reputation")],
    faq=[("Does old, untouched content stop getting cited by AI engines?",
          "It gets cited much less. Seer Interactive's study of 47,097 citations found content older than three years barely gets cited at all, and 75% of cited pages had been updated within the past year. A page that hasn't been touched in years is working against a real, measured freshness preference across the engines the study tested."),
         ("If freshness matters that much, should I just republish constantly?",
          "No, and this is the part flattened out of most freshness advice. The same study found pages cited consistently across a four-month window averaged a median content age of six months, while pages that got only a single spike citation skewed younger at a median of two months. Sustained citation tracks moderate freshness, not maximum freshness. Constant republishing chases the wrong half of the finding."),
         ("How often should I actually update a page to keep its AI citations?",
          "There's no single disclosed number for an ideal interval, but the data points toward a cadence in the range of every few months for pages that are already earning citation, rather than either never touching them or rewriting them every few weeks. Treat a six-month median as a rough anchor for sustained performers, not a precise rule."),
         ("Do all AI engines weight freshness the same way?",
          "No. Seer found Gemini weighted freshness hardest, with 78% of its citations updated within a year, ahead of ChatGPT at 73%, while Perplexity, despite its real-time reputation, came in lowest at 65%. A freshness strategy tuned to one engine won't transfer evenly to another.")],
    related=[_R_035, _R_038, ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
             "Eight checklist items, each cited to the study behind it, including the same freshness finding this piece unpacks in full.")],
    cta_h="Check whether your best pages are still earning citations", cta_p="Run your domain through the engines this research covers and see which of your pages actually show up right now. No signup, no card, about a minute.",
    body="""  <p>Two things are true about content freshness and AI citation at the same time, and most advice on the topic only states one of them. The first: a page that never gets touched is at real risk of losing citation entirely, and the data behind that is strong. The second: the pages that hold their citation over time are not the newest or most recently rewritten ones, they're the moderately fresh ones. Read only the first finding and you'll republish constantly. Read only the second and you'll leave genuinely stale pages untouched. The useful version needs both.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece is a synthesis of Seer Interactive's disclosed-methodology freshness study, which tracked 7,683 pages and 47,097 citations across ChatGPT, Gemini, and Perplexity in four verticals (pet retail, vacation rentals, energy, banking) between March and June 2026, already covered in <a href="/bg-035.html">BG-035</a> and referenced again in <a href="/bg-038.html">BG-038</a> and <a href="/bg-054.html">BG-054</a>. No new data was collected here; this piece exists to reconcile the two halves of that study's finding into a practical cadence recommendation, which none of the earlier pieces set out to do.</p>
  </div>

  <h2>The part of the finding that supports "don't go evergreen and forget it"</h2>

  <p>Seer's headline number is straightforward: 75% of cited pages had been updated within the last year, 88% within two years, and content older than three years barely gets cited at all across the three engines and four verticals tested. That's a real and fairly blunt signal against the old SEO instinct of writing a comprehensive evergreen page once and letting it sit indefinitely, and content teams that have been sitting on that instinct should treat this as a reason to revisit it.</p>

  <p>The finding gets more specific and more useful underneath the headline: 72% of citations "looked fresh" by their last-modified date, but only 42% of those pages were originally published within the past year. Most of what these engines reward as freshness is coming from edits to older pages, not a constant stream of brand-new content. That reframes the whole exercise. The lever isn't publishing volume, it's whether your best existing pages are being kept current.</p>

  <h2>The part usually left out: sustained citation tracks moderate freshness</h2>

  <p>Here's the half that gets dropped when this study gets summarized into a "publish more" directive. Pages cited consistently across the full four-month window Seer studied averaged 68% freshness with a median content age of six months. Pages that got a single spike citation and then dropped off skewed noticeably younger, 86% fresh with a median age of two months.</p>

  <p>That's the opposite of what a naive reading of the 75% headline would predict. If freshness were simply a dial where more recent always wins, the sustained performers should have been the freshest pages, not the moderately fresh ones. Instead, the pages that keep earning citation over months carry more age than the ones that spike once and disappear. A plausible read: a spike citation can come from a page that just happened to get picked up right after publication or a recent edit, a moment-in-time match to a query. Sustained citation looks more like it comes from a page that has accumulated enough substance, links, and signal over time that an engine keeps returning to it, and that accumulation takes months, not days, to build.</p>

  <h2>Reconciling the two into a practical cadence</h2>

  <p>Both findings point toward the same practical answer once you stop treating "fresh" as a single dial. Never-touched content, especially content older than two or three years, is a real and measurable risk, worth auditing and updating. But treating recency as the goal and republishing or heavily rewriting your best pages every few weeks chases the wrong half of the finding: it optimizes for the profile of a single-spike page, not a sustained performer.</p>

  <p>The better target, drawn from the six-month median age among sustained performers, is a cadence in the range of every few months for pages that are already earning citation, meaningful updates rather than either total neglect or constant republishing. A page that's cited consistently is probably not the page that needs a rewrite this quarter. A page that hasn't been touched in two years, and especially one older than three, is the one that needs attention now.</p>

  <h2>Freshness isn't one setting across engines</h2>

  <p>Seer's engine breakdown adds one more layer worth knowing before setting a single cadence and applying it everywhere. Gemini weighted freshness hardest, with 78% of its citations updated within a year, ahead of ChatGPT at 73%. Perplexity, despite its reputation as the most real-time of the major engines, came in lowest at 65%, the opposite of what its own marketing implies, at least on this specific metric and sample. A separate estimate elsewhere put a much higher share of Perplexity citations under thirteen weeks old, and the two figures don't obviously reconcile, which the study's own authors flag as itself a sign that freshness-weighting numbers move a lot depending on study design and vertical mix. If a brand leans on one engine more than others for its category, that's the freshness profile worth tuning toward rather than an average across all three.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Untouched evergreen content is a real risk, and constantly republishing isn't the fix for it. The data points toward a middle cadence, meaningful updates every few months on pages that already perform, rather than either extreme. Sustained citation rewards being current, not being new.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-070
ARTICLES.append(dict(
    slug="bg-070", bid="BG-070", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Measurement", "GEO ROI", "Analytics"],
    title="Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead",
    h1="Why GEO Cannot Be Tracked With a Pixel. <em>And What to Show Instead</em>",
    h1_plain="Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead",
    subtitle="A pixel needs a click to fire. A growing share of the searches GEO is supposed to influence never produce one. This is the honest version of the measurement problem, and four proxy metrics that survive it.",
    meta_desc="Why last-click ROI tracking structurally cannot measure GEO, and four proxy metrics that can: share of voice, mention rate trend, sentiment trend, and branded search lift.",
    og_desc="A pixel fires on a click. Most AI answers never generate one. Here is why GEO ROI is a real measurement problem, not a marketing excuse, and what to show a CFO instead of last-click attribution.",
    ld_desc="An analysis of why last-click attribution structurally cannot measure generative engine optimization ROI, covering the zero-click and pre-click shortlist mechanics, with four disclosed proxy metrics.",
    keywords="geo roi measurement, how to measure ai search visibility roi, GEO analytics, AI visibility ROI, share of voice AI search",
    about=["GEO Measurement", "AI Visibility ROI", "Marketing Analytics"],
    findings=[("68.01%", "share of Google searches ending with no click at all in early 2026, the practical ceiling on what any pixel could ever attribute, per SparkToro's disclosed panel study"),
              ("0", "UTM parameters generated when a chat answer synthesizes an opinion about a brand without ever asking the reader to click through"),
              ("4", "proxy metrics that survive the no-pixel problem: share of voice, mention and citation rate trend, sentiment trend, and branded search lift"),
              ("62-63%", "share of ChatGPT's own referral clicks landing on a homepage rather than the specific page it cited, up from roughly 26-29%, per Similarweb, meaning even the clicks GEO does produce are getting harder to tie to one page")],
    faq=[("Why can't I just put a pixel or a UTM parameter on my GEO campaign?",
          "Because most of what GEO influences never generates a click to tag. SparkToro's disclosed panel study found 68.01% of Google searches end without a click at all in early 2026, and that number only covers traditional search, not the harder-to-measure influence an AI answer has on a decision made entirely inside the chat window. A pixel needs a visit. A large and growing share of GEO's effect happens before one exists."),
         ("What should I show a CFO or a client instead of last-click ROI?",
          "Four proxy metrics that don't require a click: share of voice across engines over time, mention and citation rate trend, sentiment trend, and branded or direct search lift measured against periods of visibility improvement. None of them are revenue. All of them are honest, repeatable, and directionally meaningful."),
         ("Is share of voice a real substitute for revenue attribution?",
          "No, and it shouldn't be sold as one. It's a leading indicator, not a financial one. The honest claim is that share of voice moving up alongside branded search demand is evidence worth taking seriously, not proof of a specific dollar return."),
         ("How long before these proxy metrics tell me anything?",
          "Longer than one reporting period. AI answers are inherently unstable run to run, covered in full in <a href=\"/bg-037.html\">BG-037</a>, so a single week's share-of-voice number is closer to noise than a finding. Trend across several weeks or months is the signal, not any single reading.")],
    related=[("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The full data behind the 68.01% number this piece leans on, plus what it means for publishers who already lost the click."),
             ("/bg-073.html", "BG-073", "AI Search Visitors Convert Up to 23 Times Higher Than Organic",
              "The rare cases where a click does happen convert dramatically better, which is a reason to keep measuring, not a reason to stop reading this one."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "Why a single share-of-voice reading is closer to a snapshot than a fact, and what to track instead.")],
    cta_h="See your own share of voice, not a projected one",
    cta_p="Run your domain through the same engines this piece is talking about. You get a real mention and citation baseline on screen, the actual starting point for the trend that matters more than any single ROI number.",
    body="""  <p>Ask a GEO vendor for their ROI dashboard and most of them will show you a click. That click is the wrong unit to be measuring, and not because anyone is hiding something. A pixel fires when a browser lands on a page carrying a tracking script and a referring URL attached to it. A large and growing share of what generative engine optimization is actually supposed to influence never produces either one.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece draws on SparkToro's disclosed Similarweb-panel methodology (US-only, January to April 2026, covered in full in <a href="/bg-039.html">BG-039</a>) for the zero-click figures, and on Similarweb's reporting on ChatGPT's referral-destination shift for the homepage-attribution point. Both are named, dated sources with disclosed sample scope. Dated <strong>14 August 2026</strong>.</p>
  </div>

  <h2>The two reasons a pixel structurally cannot see this</h2>

  <p>The first reason is the zero-click shift itself. SparkToro's disclosed panel data put <strong>68.01% of Google searches ending without a click</strong> in the first four months of 2026, up from 60.45% in 2024 and 49% in 2019, and that figure covers traditional search results, not the answer a chat interface gives directly inside its own window. When an AI engine reads several sources, synthesizes a recommendation, and states it as prose with no link attached, nothing was ever available to click. There is no missing pixel here. There was never a page for one to load on.</p>

  <p>The second reason is subtler and gets missed even by people who accept the first one: influence happens earlier than the click, in what amounts to a pre-click shortlist stage. A buyer asks an AI engine to narrow a category down to three or four options, reads the answer, and only then, if at all, opens a browser tab to confirm. The AI answer did the actual persuading. The click, when it happens, is a formality that a pixel will happily attribute to whatever page the buyer visited last, usually not the one that did the convincing.</p>

  <h2>It gets worse even where a click does happen</h2>

  <p>Even the clicks GEO does generate are getting harder to pin to one asset. Similarweb's tracking found that ChatGPT's homepage-only referrals, as opposed to a deep link straight to the specific page it cited, rose from roughly 26 to 29% of its referral traffic to roughly <strong>62 to 63%</strong> over a recent measured window. A rising share of the clicks that do occur are landing on a brand's homepage generically, not the article or page the model actually pulled from. Attribution software built for the ten-blue-links era assumes the click lands where the credit belongs. Increasingly, it doesn't.</p>

  <h2>Four things worth showing instead</h2>

  <p>None of this means GEO's effect is unmeasurable, only that the honest metrics look different from a conversion pixel. Four hold up under scrutiny:</p>

  <ul>
    <li><strong>Share of voice across engines, tracked over time.</strong> The percentage of relevant category prompts where a brand is mentioned at all, per engine, watched for direction rather than treated as a single score.</li>
    <li><strong>Mention and citation rate trend.</strong> Not just whether a brand is named, but whether it's cited with an actual source attached, and whether that rate is moving.</li>
    <li><strong>Sentiment trend.</strong> Positive, neutral, or negative, tracked the same way, since a rising mention rate attached to worsening sentiment is not a win.</li>
    <li><strong>Branded and direct search lift, correlated with visibility improvements.</strong> If more people start searching a brand's name directly after a visibility push, that's a real behavioral signal, even without a clean causal chain back to any one piece of content.</li>
  </ul>

  <p>None of the four is revenue, and none should be presented as if it were. What they share is that they don't require a click to exist, and they can be measured consistently, run over run, which is more than a pixel can currently offer this medium.</p>

  <div class="callout teal">
    <div class="callout-label">The honest version</div>
    <p>GEO's ROI problem is real, not a dodge. The fix isn't a better pixel. It's swapping last-click attribution for a set of proxy metrics that were built for a medium with a click in it, and being upfront that a rising trend is evidence, not proof.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-071
ARTICLES.append(dict(
    slug="bg-071", bid="BG-071", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Media Literacy", "Myth-Bust", "GEO Statistics"],
    title="The 40 Percent FAQ Schema Weighting Stat Has No Disclosed Source",
    h1="The 40 Percent FAQ Schema Weighting Stat. <em>Has No Disclosed Source</em>",
    h1_plain="The 40 Percent FAQ Schema Weighting Stat Has No Disclosed Source",
    subtitle="A precise-sounding number about how ChatGPT weighs FAQ schema circulates across GEO content with no study behind it. What that reveals about how unverifiable stats spread, and how to catch the next one.",
    meta_desc="The '40% higher weighting for FAQ schema' stat repeated across GEO marketing traces to no named study. A case study in how unverifiable statistics spread, and a checklist to catch the next one.",
    og_desc="A specific number about FAQ schema and AI citation gets repeated everywhere in GEO content. Nobody has traced it to an actual study. Here's what that says about how this industry's statistics spread.",
    ld_desc="A media-literacy case study on an unverifiable GEO statistic, the '40% FAQ schema weighting' claim, tracing how it circulates without a disclosed source and how to evaluate similarly precise, uncited numbers.",
    keywords="faq schema weighting ai citation, geo statistics you shouldn't trust, AI citation myths, unverified GEO statistics, how to spot fake SEO stats",
    about=["Methodology Transparency", "AI Citation Research", "Media Literacy"],
    findings=[("40%", "the precise figure attributed to FAQ schema and inline citations in ChatGPT's source selection, repeated across GEO-vendor blogs with no named study behind it"),
              ("0", "named studies, sample sizes, or date ranges this research pass could find behind that 40% figure, across every source repeating it"),
              ("4+", "separate GEO-vendor blogs found stating the identical 40% number, none citing an original source"),
              ("1,885", "pages a real matched-control study did test on a related schema claim, finding no significant citation lift at all, the opposite of a confident weighting figure")],
    faq=[("Is the \"40% weighting\" FAQ schema statistic true?",
          "It cannot be verified either way, and that is the actual finding. No source in this research pass could trace the number to a named study, a disclosed sample size, or a stated date range. It should be treated as an unsupported specific attached to a plausible-sounding general idea, not as a fact."),
         ("Where did a number this specific probably come from?",
          "The likely pattern, seen repeatedly in this category: an early piece states a precise number with no citation, a second piece repeats it because it reads as established, and by the third or fourth repetition nobody questions it because it now appears to have consensus behind it. Consensus built this way is not evidence, it's just repetition."),
         ("How do I tell a trustworthy GEO statistic from an untrustworthy one?",
          "Ask four questions before repeating any number: is there a named study behind it, is the sample size disclosed, is there a stated date range, and does the source trace back to an original measurement rather than another blog post citing a third blog post. A precise percentage with none of those four is a guess wearing a lab coat."),
         ("What's the closest thing to real evidence on this exact question?",
          "A matched-control test, not this claim directly. <a href=\"/bg-038.html\">BG-038</a> covers Ahrefs' test of 1,885 pages that added JSON-LD schema, matched against control pages, which found no statistically significant citation lift on any platform. It doesn't test the specific 40% FAQ-weighting claim, but it tested the closest adjacent, actually-measurable question, and found the opposite of a confident weighting bonus.")],
    related=[("/bg-038.html", "BG-038", "Six AI Citation Claims the Industry Keeps Repeating",
              "The matched-control test that actually checked a related schema claim, and found no lift where this one assumes a 40% bonus."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "The same skepticism applied to vendor visibility scores: precise numbers with no disclosed method behind them."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "A method for checking your own results directly instead of trusting a number someone else published.")],
    cta_h="Check your own citation rate instead of trusting a borrowed number",
    cta_p="Run your domain through the real engines and see whether you're cited at all, with the method disclosed on screen. No borrowed percentage required.",
    body="""  <p>Somewhere in the GEO content circulating right now is a sentence that reads roughly like this: FAQ schema and inline citations carry about 40% higher weighting in how ChatGPT selects its sources. It shows up confidently, in listicles and vendor blog posts, phrased as if someone measured it. This research pass went looking for that measurement. It does not exist, at least not anywhere findable.</p>

  <div class="callout">
    <div class="callout-label">How this was researched, and what it could not find</div>
    <p>Live research pass, <strong>14 August 2026</strong>. The 40% FAQ-schema-weighting claim was checked against every source repeating it: Darkroom, Kime.ai, Wellows, and Ai Boost all state a version of the number with no named study, no sample size, and no stated date range. None cites an original source. This is not a case of a study existing that the pass simply missed a citation for; the number appears to have no traceable origin at all, which is itself the finding worth publishing.</p>
  </div>

  <h2>The claim, exactly as it circulates</h2>

  <p>The specific wording varies slightly by source, but the shape is consistent: FAQ schema markup, and inline citations near the claim they support, receive roughly 40% higher weighting when ChatGPT decides which sources to draw an answer from. It is stated as a number, not a range, and stated with no hedge attached, which is exactly what makes it read as settled.</p>

  <h2>What a source chain that traces to nothing looks like</h2>

  <p>This is worth walking through mechanically, because the pattern repeats constantly in this category and is worth recognizing on sight. An early piece states a precise number, often because it sounds plausible given how the product visibly behaves, with no citation attached. A second piece, written later, repeats the number because the first piece already said it and reads as if it knows something. A third piece, usually a roundup titled something like "GEO statistics 2026," lists the number alongside dozens of others, flattening the distinction between a disclosed study and an unsupported guess into the same bullet-point format. By the fourth or fifth repetition, nobody questions it, because questioning a number that four sources already agree on feels unnecessary. Four sources agreeing is not four measurements. It's one unsupported guess, copied four times.</p>

  <h2>What was actually tested, for contrast</h2>

  <p>A genuinely adjacent claim was tested with a real matched-control design, and it's worth holding up against this one. Ahrefs tracked 1,885 pages that added JSON-LD schema, matched each against control pages with similar existing citation levels that didn't add it, and measured citation-count change across three AI surfaces. The result, covered in full in <a href="/bg-038.html">BG-038</a>: no statistically significant citation increase on any platform, with one surface's citations actually falling. That's not proof the 40% FAQ-schema claim is false specifically, since it tests a different, narrower mechanism. But it is direct evidence that the closest testable version of "schema markup earns AI engines' favor" did not hold up when someone actually looked, which should lower anyone's confidence in an unsourced cousin of that same claim.</p>

  <h2>A short checklist for the next suspiciously precise stat</h2>

  <ul>
    <li>Ask for the source. Not "the data shows," an actual named study or report.</li>
    <li>Check the sample size. A number with no stated N behind it is an opinion with a decimal point.</li>
    <li>Check the date range. AI platforms change monthly; an undated number could describe last year's model.</li>
    <li>Be skeptical of exact percentages with no study named. Real measurements usually come with a margin, a caveat, or both.</li>
    <li>Check whether the sources citing it are citing each other, not an original measurement.</li>
  </ul>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A number that four blogs repeat with no source between them is not more credible than a number one blog states alone. It's the same unsupported guess, laundered through repetition until it stops sounding like one. The fix is the same every time: ask where it came from, and if nobody can answer, stop repeating it.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-072
ARTICLES.append(dict(
    slug="bg-072", bid="BG-072", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Reddit", "AI Citations", "Per-Engine Strategy"],
    title="Reddit Dominates Perplexity's Citations and Is Nearly Invisible in Gemini's",
    h1="Reddit Dominates Perplexity's Citations. <em>Nearly Invisible in Gemini's</em>",
    h1_plain="Reddit Dominates Perplexity's Citations and Is Nearly Invisible in Gemini's",
    subtitle="24% of Perplexity's citations trace to Reddit. Gemini's figure is 0.1%. A single 'get on Reddit' GEO tactic reaches one engine's users heavily and barely touches another's.",
    meta_desc="Reddit accounts for 24% of Perplexity's citations and just 0.1% of Gemini's, per Tinuiti's Q1 2026 report. What the gap means for GEO strategy, and the licensing tension behind it.",
    og_desc="Same platform, wildly different citation behavior: Reddit is nearly a quarter of what Perplexity cites and almost nothing in Gemini's answers. Here's why a single Reddit tactic won't reach both audiences.",
    ld_desc="An analysis of the disparity in Reddit's citation share between Perplexity and Gemini, its practical implications for engine-specific GEO strategy, and the Reddit data-licensing tension that could shift it again.",
    keywords="reddit ai search citations, perplexity reddit citations, gemini reddit citations, GEO reddit strategy, does reddit help ai visibility",
    about=["AI Citation Research", "Reddit", "Per-Engine GEO Strategy"],
    findings=[("24%", "share of Perplexity's citations traced to Reddit alone in the four months ending January 2026, per Tinuiti's Q1 2026 AI Citations Trends Report"),
              ("0.1%", "Gemini's Reddit citation share in the same window and report, a near-total absence on the same platform"),
              (">5%", "ChatGPT's Reddit citation share in the same report, real but far smaller than Perplexity's"),
              ("40.1%", "Reddit's share of LLM references overall in a separate, earlier Semrush study of 150,000 citations, a notably higher figure that does not fully reconcile with Tinuiti's per-engine numbers")],
    faq=[("Why does Reddit show up so much more in Perplexity than in Gemini?",
          "The two engines retrieve sources through genuinely different mechanisms, covered in full in <a href=\"/bg-044.html\">BG-044</a>: Perplexity is architected around breadth of retrieval across a wide index including forums, while Gemini grounds primarily through a Google Search API call. That architectural difference is a plausible explanation for the gap, not a proven cause of it; no source in this research pass directly tested why the split exists this widely."),
         ("Should I invest in getting my brand discussed on Reddit for GEO?",
          "Only if you know which engine your buyers actually use. A brand whose category research happens mostly in Gemini or Google's AI surfaces would see very little return from a Reddit-only push, while a Perplexity-heavy audience would see real exposure. Check your own mix before committing budget to one channel; a self-audit method for exactly this is in <a href=\"/bg-053.html\">BG-053</a>."),
         ("Will this gap stay stable, or is it likely to shift?",
          "It's already under real pressure. Reddit's data-licensing deals with Google (roughly $60 million a year since February 2024) and OpenAI (roughly $70 million a year since mid-2024) are both up for renewal in 2026, and Reddit's stock dropped in July 2026 on reporting it may not renew the Google deal, precisely because Google's own AI answers are cutting into the referral traffic those payments were meant to offset. A renegotiated or lapsed deal could move these percentages again, in either direction."),
         ("Does a high Reddit citation share mean Reddit conversations control what an engine says about my brand?",
          "Not necessarily, and it's worth separating general topic citations from brand-specific ones. Yext's disclosed study of 6.8 million AI citations found that when the question is specifically about a brand, 86% of citations trace back to sources the brand itself controls, its own site and business listings, with reviews and social media (Reddit included) contributing only 8%. Reddit's dominance shows up heavily in general category and opinion questions; it plays a smaller role once a query is asking about your brand by name.")],
    related=[("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "The architectural differences behind why Reddit's citation share swings this hard between engines."),
             ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The Reddit licensing-deal tension in fuller context, alongside the broader traffic shift it's part of."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "Check which engines your own buyers actually land on before betting a channel strategy on one platform's habits.")],
    cta_h="Find out which engines actually cite your category",
    cta_p="Run your domain through ChatGPT, Gemini, Perplexity and the rest at once. You'll see which engines are already citing sources like yours, and which ones a Reddit push would barely reach.",
    body="""  <p>Reddit is not one input into AI search. It's several, and they don't behave the same way twice. In the four months ending January 2026, Reddit accounted for <strong>24% of Perplexity's citations</strong>. In the same window, on the same topic categories, it accounted for <strong>0.1%</strong> of Gemini's. That is not a small gap. It is close to Reddit existing for one engine and not existing for the other.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>The primary figures trace to Tinuiti's Q1 2026 AI Citations Trends Report, which tracked citations across nine commercial categories and seven major AI platforms over the four months ending January 2026, a named study with a disclosed scope and date range. A separate, earlier Semrush study (June 2025, 150,000 AI citations across 5,000 randomly selected keywords) found Reddit accounting for 40.1% of LLM references overall, a meaningfully higher number that doesn't fully reconcile with Tinuiti's per-engine breakdown, likely reflecting different category mixes and measurement windows between the two studies. Both are reported here as exactly what they are, disclosed but not identical methodologies, rather than averaged into one false consensus number. Dated <strong>14 August 2026</strong>.</p>
  </div>

  <h2>The size of the gap, and a plausible reason for it</h2>

  <p>ChatGPT sits in between the two extremes, drawing more than 5% of its citations from Reddit in the same Tinuiti window, real but nowhere near Perplexity's share. The likeliest explanation is architectural rather than editorial: <a href="/bg-044.html">Perplexity is built around breadth of retrieval</a> across a wide index that includes forum content, while Gemini grounds primarily through a metered Google Search API call that appears to surface forum content far less often. That's a reasonable read of why the gap exists, not a proven causal chain; no source in this pass tested the mechanism directly, and it's worth holding that distinction rather than stating it as settled.</p>

  <h2>Why "get on Reddit" isn't one tactic</h2>

  <p>The practical consequence is straightforward and easy to miss if you think of GEO as one undifferentiated channel. A brand or product that's actively discussed on Reddit is reaching Perplexity's users at real scale and Gemini's users at almost none. Treating "get discussed on Reddit" as a universal GEO tactic assumes the audience is engine-agnostic, and it isn't. Before committing budget or outreach effort to building a Reddit presence specifically for AI visibility, it's worth knowing which engines your actual buyers land on, using a method like the one in <a href="/bg-053.html">BG-053</a>, rather than assuming a Reddit push pays off evenly everywhere.</p>

  <h2>The owned-versus-earned complication</h2>

  <p>There's a real nuance sitting underneath the headline gap. Yext's disclosed study of 6.8 million AI citations across 1.6 million queries per model found that when a question is specifically about a named brand, 86% of citations trace back to sources the brand itself controls, its website and business listings, with reviews and social platforms including Reddit contributing only 8%. Reddit's dominance shows up hardest on general category and opinion questions, the "best X for Y" style prompt with no brand name in it. Once a query names your brand directly, owned content does most of the work. Both things are true at once, and a GEO strategy built on only one of them will misjudge where the leverage actually is.</p>

  <h2>The licensing tension that could move this number again</h2>

  <p>None of these percentages are fixed. Reddit is paid roughly $60 million a year by Google since February 2024, and roughly $70 million a year by OpenAI since mid-2024, for licensed access to its content, and both deals are up for renewal in 2026. Reddit's stock dropped in July 2026 on reporting that it may not renew the Google deal, precisely because Google's own AI answers are cutting into the same referral traffic those payments were meant to offset. <a href="/bg-039.html">The fuller version of that tension</a> is worth reading before assuming today's citation split holds through the end of the year.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Reddit is not a universal GEO lever. It's a Perplexity lever, a modest ChatGPT lever, and close to a non-factor for Gemini, at least on the categories measured here. Know which engine your buyers actually use before deciding how much of your effort belongs on one platform.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-073
ARTICLES.append(dict(
    slug="bg-073", bid="BG-073", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Conversion Rate", "AI Search Traffic", "GEO Measurement"],
    title="AI Search Visitors Convert Up to 23 Times Higher Than Organic",
    h1="AI Search Visitors Convert Up to <em>23 Times Higher</em> Than Organic",
    h1_plain="AI Search Visitors Convert Up to 23 Times Higher Than Organic",
    subtitle="Three separate reports, three different multiples, one consistent direction: the small number of visitors an AI answer actually sends convert far better than typical organic traffic. What that does and doesn't prove.",
    meta_desc="Ahrefs found its own AI-referred traffic converting 23x higher than organic; Semrush found 4.4x; Adobe found 54% better. What the range means, and why higher conversion doesn't mean chase it at all costs.",
    og_desc="0.5% of Ahrefs' traffic drove 12.1% of its signups, a 23x conversion gap. Semrush found a smaller 4.4x. Adobe's more rigorous data found 54%. Same direction, different sizes, and a real caveat about volume.",
    ld_desc="An examination of disclosed and vendor-reported findings on AI referral traffic conversion rates, comparing Ahrefs', Semrush's, and Adobe's figures and assessing the plausibility and limits of the pre-qualification explanation.",
    keywords="ai search traffic conversion rate, does ai referral traffic convert, AI referral conversion rate, GEO ROI, AI traffic converts better",
    about=["AI Referral Traffic", "Conversion Rate Optimization", "GEO Measurement"],
    findings=[("23x", "the conversion-rate multiple Ahrefs found for its own AI-referred visitors against organic search visitors, June 2025, single-company self-reported data"),
              ("12.1%", "share of Ahrefs' signups that came from the 0.5% of its traffic arriving via AI search, the ratio behind the 23x figure"),
              ("4.4x", "a separate, lower conversion multiple Semrush reported for AI search traffic on informational and consideration-stage queries, June 2025, across 500+ tracked topics"),
              ("54%", "the conversion lift Adobe measured for AI-referred retail visitors against non-AI visitors, the most rigorously disclosed of the three figures, drawn from over 1 trillion tracked site visits")],
    faq=[("Which number should I actually believe, 23x or 4.4x?",
          "Neither as a fixed constant. They come from different companies, different traffic mixes, and different disclosure quality. Ahrefs' 23x is real but self-reported from its own traffic with no published sample details beyond that. Semrush's 4.4x comes with an explicit sample-bias caveat, since it's drawn from digital marketing and SEO topics where AI adoption already runs high. Adobe's 54% lift is the most rigorously disclosed of the three, backed by over a trillion tracked visits, and it's also the smallest multiple, which is itself informative: the better-disclosed number is the more conservative one."),
         ("Why would AI-referred visitors convert better at all?",
          "The plausible mechanism is pre-qualification. Someone who reaches your site after an AI engine already summarized the category, compared a few options, and pointed them toward you has effectively been pre-vetted before they ever land on the page. They arrive with a narrower, more specific need already formed, closer to the bottom of a funnel than a typical organic click that's still exploring."),
         ("If AI traffic converts so much better, should I focus all my effort on driving it?",
          "Not at the expense of everything else. The absolute volume is still small: even the more mature AI referral figures put standalone AI-platform traffic in the low single digits of total site visits for most sites, and AI Mode itself accounted for only 0.34% of total Google search volume in one disclosed measurement. A dramatically better conversion rate on a tiny base still produces a small number of customers. It's worth pursuing and measuring properly, not worth treating as the only channel that matters."),
         ("Is this data self-reported by companies with an interest in AI traffic looking good?",
          "Largely yes for Ahrefs, which analyzed and published its own traffic on its own blog, and to a lesser degree for aggregator sites repeating the figure. Adobe and Semrush are commercial analytics and marketing platforms with their own interests, but their sample sizes and disclosed methodology are considerably stronger, which is why their smaller, more conservative numbers deserve more weight than the flashier headline figure.")],
    related=[("/bg-070.html", "BG-070", "Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead",
              "The proxy metrics worth tracking while this small, high-converting AI traffic segment keeps growing."),
             ("/bg-074.html", "BG-074", "AI Referral Traffic Grew 527 Percent Year Over Year. What Is Actually Driving It.",
              "The growth behind the base this conversion advantage applies to, and how small that base still is."),
             ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "Why so few searches produce a click at all, the context for why any AI-referred traffic is still a small number.")],
    cta_h="Find out if you're even eligible for this traffic yet",
    cta_p="A higher conversion rate on AI-referred visitors means nothing if an engine never mentions you in the first place. Run your domain through the engines this data covers and see where you stand before chasing the multiple.",
    body="""  <p>Three separate reports, from three separate companies, using three separate methods, all point the same direction: the small slice of a site's traffic that arrives by way of an AI answer converts meaningfully better than the traffic arriving through a typical organic search result. They don't agree on the size of the gap. That disagreement is worth sitting with rather than picking whichever number sounds best.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Three sources, disclosed at three different levels of rigor. Ahrefs analyzed its own site traffic (June 2025, no published sample size beyond its own data) and found AI-referred visitors converting at 23 times the rate of organic, with 0.5% of traffic driving 12.1% of signups. Semrush (June 2025) reported a 4.4x conversion advantage for AI search traffic on informational and consideration-stage queries across 500+ tracked topics, with an explicit caveat that its sample skews toward digital marketing and SEO content where AI adoption is already highest. Adobe Digital Insights, drawing on more than 1 trillion tracked visits to US retail sites since October 2024, reported AI-referred traffic converting 54% better than non-AI traffic, the smallest multiple of the three and the one with by far the largest disclosed sample. Dated <strong>14 August 2026</strong>.</p>
  </div>

  <h2>Three studies, three multiples</h2>

  <p>Ahrefs' number is the most dramatic and the least independently verifiable: a single company's own traffic, analyzed and published on its own blog, with no disclosed sample size beyond "our own data." Semrush's 4.4x sits in the middle and comes with the most honest caveat of the three, stating plainly that its underlying topics skew toward the audience most likely to already be using AI tools, which would inflate the apparent conversion gap versus a more representative sample. Adobe's 54% is the outlier in the opposite direction: the smallest headline number, but backed by the largest and most rigorously disclosed dataset of the three. That pattern, where better disclosure produces a more conservative number, is worth noticing on its own, independent of which figure is technically "correct."</p>

  <h2>Why this is plausible, not just favorable marketing</h2>

  <p>There's a real mechanism behind all three findings, not just a coincidence of timing. A visitor who reaches a site after an AI engine has already summarized the category and narrowed the field has effectively been pre-qualified before the click ever happens. They aren't arriving to figure out what they need; the AI answer already did a version of that work. What's left is confirming a decision that's already mostly made, which is a fundamentally higher-intent visit than a first-touch organic click still in the exploration phase.</p>

  <h2>What "converts higher" doesn't mean</h2>

  <p>None of the three studies isolate cause from selection. It's possible that people who reach a brand through an AI answer were already more likely to convert for reasons unrelated to the AI referral itself, simply because AI-search adoption still skews toward more engaged, higher-intent internet users generally. And the volume caveat matters more than the multiple: even the more mature disclosed figures put standalone AI-platform referral traffic in the low single digits of total site visits for most sites, and one disclosed measurement put AI Mode's own share of total Google search volume at just 0.34%. A 23x conversion rate against a base that's a fraction of a percent of total traffic still yields a small number of actual customers. That's a reason to measure this segment properly, not a reason to treat it as the whole strategy.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Three sources, three multiples, one honest pattern: AI-referred visitors convert better, and the best-disclosed number is also the smallest one. Worth tracking as its own segment. Not yet worth building a channel strategy around, given how small the base still is.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-074
ARTICLES.append(dict(
    slug="bg-074", bid="BG-074", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["AI Referral Traffic", "Web Analytics", "Original Research"],
    title="AI Referral Traffic Grew 527 Percent Year Over Year. What Is Actually Driving It.",
    h1="AI Referral Traffic Grew <em>527 Percent</em> Year Over Year. What Is Actually Driving It.",
    h1_plain="AI Referral Traffic Grew 527 Percent Year Over Year. What Is Actually Driving It.",
    subtitle="Two separate measurements, a 527% year-over-year jump and a 9.9x rise over 19 months, both point at real growth from a small base, and ChatGPT is still 92.4% of it. How to check your own site's number.",
    meta_desc="AI referral traffic to websites grew 527% year over year and 9.9x over 19 months, with ChatGPT at 92.4% share. What counts as AI referral traffic, and how to check your own analytics for it.",
    og_desc="Two disclosed traffic studies found AI referral sessions up 527% year over year and 9.9x over 19 months, ChatGPT still 92.4% of it. Here's what actually counts as an AI referral, and how to check your own site.",
    ld_desc="An analysis of disclosed traffic studies measuring AI referral traffic growth, defining what qualifies as AI referral traffic technically, and providing a method for checking a site's own analytics for it.",
    keywords="ai referral traffic growth 2026, how to track chatgpt referral traffic, AI referral traffic statistics, chatgpt referral traffic, AI traffic analytics",
    about=["AI Referral Traffic", "Web Analytics", "GEO Measurement"],
    findings=[("527%", "year-over-year growth in AI-sourced website sessions comparing January-May 2024 to January-May 2025, across 400+ tracked sites and 12 industries, per the Previsible/Superprompt AI Traffic Report"),
              ("9.9x", "growth in monthly LLM-referred sessions over the 19 months from November 2024 to May 2026, across 166 tracked GA4 properties, per Previsible's later 2026 report"),
              ("92.4%", "ChatGPT's share of all trackable standalone-LLM referral sessions in that same 2026 report, and still gaining relative share"),
              ("64x", "Claude's own session growth over the same 19-month window, from a tiny base, the fastest-growing single engine measured even though its total share stayed under 1%")],
    faq=[("What exactly counts as \"AI referral traffic\"?",
          "A visit where the referrer header, what shows up in an analytics tool as session source or medium, indicates the click originated from a standalone AI platform domain: chatgpt.com or chat.openai.com, gemini.google.com, claude.ai, or perplexity.ai. It requires an actual click-through. That makes it a fundamentally different, smaller thing than a mention with no click at all, the zero-click case covered in <a href=\"/bg-039.html\">BG-039</a>, and it explicitly excludes Google AI Overviews, which doesn't generate a separately trackable referral the way a standalone chat app does."),
         ("Will ChatGPT's 92.4% share of AI referral traffic last?",
          "Probably not at that level indefinitely. Claude grew 64 times over the same 19-month window measured in this same report, admittedly from a very small base, and generative AI competition from Gemini and other assistants continues to intensify generally. A separate Similarweb measurement, using a different methodology and scope, found ChatGPT's worldwide web-traffic referral share falling from roughly 76% to about 53% over a comparable window, a real reminder that these percentages depend heavily on what exactly is being measured and shouldn't be treated as one settled number."),
         ("How do I check how much AI referral traffic my own site actually gets?",
          "In GA4, open the Traffic Acquisition report and look at Session source or Session source/medium, or filter by hostname referrer, for the five domain patterns: chatgpt.com, chat.openai.com, gemini.google.com, claude.ai, and perplexity.ai. Segment that traffic out and look at its trend and its conversion behavior separately from the rest of your organic traffic."),
         ("Does this number include Google AI Overviews traffic?",
          "No. Previsible's stated methodology explicitly excludes AI Overviews, because it doesn't generate a standalone, separately trackable referral the way a dedicated chat platform does. That means the true scope of AI-influenced traffic, including whatever click volume Overviews itself sends, is understated by this framing, not overstated. It's a real gap in the measurement, worth knowing before treating this number as the complete picture.")],
    related=[("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The flip side of this growth: the much larger share of searches that never generate any referral at all."),
             ("/bg-073.html", "BG-073", "AI Search Visitors Convert Up to 23 Times Higher Than Organic",
              "What the traffic measured here is actually worth once it lands, according to three separate reports."),
             ("/bg-070.html", "BG-070", "Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead",
              "Why referral traffic alone, even growing this fast, is still only part of the measurement picture.")],
    cta_h="See whether your own traffic shows this shift yet",
    cta_p="Before chasing a referral number, check whether the engines driving it even know your brand exists. Run your domain through the same platforms this data tracks and see where you stand.",
    body="""  <p>Two numbers describe the same underlying shift at two different scales. AI-sourced website sessions grew <strong>527% year over year</strong> comparing January through May 2024 against the same months in 2025. A later, larger measurement found monthly sessions growing <strong>9.9 times</strong> over the 19 months from November 2024 to May 2026. Both are real. Both describe growth from a genuinely small starting base, and neither means what a casual read of the headline number might suggest.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Two separate, related reports from the same research lineage. The 527% figure comes from the Superprompt / Previsible AI Traffic Report (2025), tracking sessions across 400+ websites and 12 industries, sessions rising from 17,076 to 107,100 across that year-over-year window. The 9.9x figure comes from Previsible's later 2026 AI Traffic Study, a larger measurement spanning 166 tracked GA4 properties over 19 months (November 2024 to May 2026), 6.77 million total LLM-driven sessions across nine industries, with monthly sessions rising from 65,249 to 644,478. Both are named, dated reports with disclosed sample scope, treated here as vendor-disclosed rather than academic peer-reviewed research. Dated <strong>14 August 2026</strong>.</p>
  </div>

  <h2>Two numbers, two different windows</h2>

  <p>The 527% figure is the earlier, smaller-sample measurement: a straight year-over-year comparison across roughly 90,000 additional monthly sessions on 400-plus sites. The 9.9x figure is the more recent and considerably larger study, covering nearly seven times as many total sessions across a longer 19-month window. They shouldn't be read as two conflicting claims about the same thing; they're two snapshots of the same growth curve taken about a year apart, using an expanded and more current sample the second time.</p>

  <h2>What "AI referral traffic" actually means, technically</h2>

  <p>This is the distinction worth being precise about, because the term gets used loosely. AI referral traffic, in both studies above, means a real click-through: a session where the referrer header, the field analytics tools read as session source, shows the visit originated from a standalone AI platform domain rather than a search engine or direct navigation. That is a fundamentally different, much smaller category than a brand mention with no click attached at all, the zero-click scenario covered in <a href="/bg-039.html">BG-039</a>, where the vast majority of AI-influenced decisions actually happen. It's also worth noting Previsible's methodology explicitly excludes Google AI Overviews from this count, since Overviews doesn't produce a separately trackable referral the way a standalone chat app's outbound link does. The real total of AI-influenced traffic, including whatever Overviews itself sends, is understated by this framing, not inflated.</p>

  <h2>Why ChatGPT's dominance likely won't hold at this level</h2>

  <p>ChatGPT accounted for <strong>92.4%</strong> of all trackable standalone-LLM referral sessions in the more recent study, up from around 84% roughly six months earlier, and its own session count grew 12.8 times over the full window. But the more interesting number sits underneath it: Claude grew 64 times over the same period, from a tiny 133 monthly sessions to 8,528, overtaking Perplexity for the first time in March 2026. That's still a small absolute number next to ChatGPT's, but it's the fastest growth rate of any engine measured, and it's exactly the kind of early movement that tends to compound. A separate Similarweb measurement, using a different scope and methodology, found ChatGPT's worldwide referral share falling from roughly 76% to about 53% over a comparable window, a real reminder that these headline percentages shift depending on exactly what's being counted, not a single fixed fact about the category.</p>

  <h2>How to check your own site</h2>

  <p>In GA4, open the Traffic Acquisition report and look at Session source or Session source/medium, or build a filter on hostname referrer, for these five patterns: <strong>chat.openai.com</strong>, <strong>chatgpt.com</strong>, <strong>gemini.google.com</strong>, <strong>claude.ai</strong>, and <strong>perplexity.ai</strong>. Segment that slice of traffic out and watch its trend separately from general organic. One honest caveat worth carrying into that check: some AI platforms, particularly mobile apps, can strip the referrer entirely, which means a real AI-referred visit sometimes shows up as direct traffic instead. Any number you pull this way is a floor, not a ceiling.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>AI referral traffic is genuinely growing fast, by 527% year over year on one measure and 9.9x over 19 months on a larger, later one, and ChatGPT still sends most of it. Both facts are true at once, and the second one is the more temporary of the two.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-075
ARTICLES.append(dict(
    slug="bg-075", bid="BG-075", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Original Research", "AI Citation", "Content Strategy"],
    title="Brand Mentions Correlate With AI Visibility More Than Backlinks Do",
    h1="Brand Mentions Correlate With AI Visibility <em>More Than Backlinks Do</em>",
    h1_plain="Brand Mentions Correlate With AI Visibility More Than Backlinks Do",
    subtitle="Ahrefs found a 0.664 correlation between branded web mentions and ChatGPT citation across 75,000 brands. Raw backlink count came in weak on every engine it tested. Here is what that gap actually means, and the causation question it does not settle.",
    meta_desc="Ahrefs' 75,000-brand study found a 0.664 correlation between brand mentions and AI citation, stronger than backlinks. What that number means in plain terms, and what it does not prove about causation.",
    og_desc="0.664 for branded mentions against ChatGPT citation. Weak, unnumbered, for raw backlink count. A real gap in a disclosed 75,000-brand study, and a careful look at what a correlation like that can and cannot tell you.",
    ld_desc="An explainer on Ahrefs' disclosed correlation study comparing branded web mentions against raw backlink count as signals for AI engine citation, with a plain-terms reading of what a 0.664 correlation coefficient means and does not mean.",
    keywords="brand mentions vs backlinks ai visibility, unlinked mentions ai search, ai citation correlation study, does brand awareness help ai search, ahrefs ai visibility correlation, GEO backlinks vs mentions",
    about=["AI Citation Research", "Generative Engine Optimization", "Content Strategy", "Original Research Synthesis"],
    findings=[("0.664", "Ahrefs' Spearman correlation between branded web mentions and ChatGPT citation, across 75,000 brands"),
              ("Weak", "the correlation Ahrefs found between raw backlink count and citation, across all three engines it tested"),
              ("75,000", "brands in the Ahrefs correlation study this piece is built on, filtered to Domain Rating above 40"),
              ("0.49", "a separate, lower correlation for referring domains found by Search Engine Journal and Victorious, in a smaller 175-brand study")],
    faq=[("Do brand mentions matter more than backlinks for AI visibility?",
          "On the one disclosed study that measured both signals side by side, yes, by a wide margin. Ahrefs found branded web mentions correlated with ChatGPT citation at 0.664 across 75,000 brands, while raw backlink count came in weak across all three engines it tested, ChatGPT, Google AI Mode and Google AI Overviews. Ahrefs did not publish a specific number for the backlink correlation, only that it was weak, which is itself worth noting rather than assuming a precise figure exists."),
         ("What does a correlation of 0.664 actually mean?",
          "It means brands with more branded web mentions are meaningfully more likely to be cited by the engine, but the relationship is far from a guarantee. Squaring a correlation coefficient gives a rough sense of shared variance, and 0.664 squared is about 0.44, so even taking that loosely, more than half of what determines whether a brand gets cited is explained by something other than mention volume alone."),
         ("Do brand mentions need to be hyperlinked to count in this correlation?",
          "No, and that is the actual point of the finding. Ahrefs measured branded web mentions, not backlinks, meaning the brand's name appearing on a page counted whether or not that page linked back to the brand's site. An unlinked mention still showed a far stronger relationship with citation than a linked one did through raw backlink count."),
         ("Does this mean backlinks are worthless for AI search?",
          "No, and treating it that way overstates a single study. Search Engine Journal and Victorious measured a related but different signal, referring domains, and found a moderate 0.49 correlation with AI mention rate in a smaller, 175-brand study, a genuinely different result from Ahrefs' weak backlink finding. The two disclosed studies do not fully agree, which BG-038 covers as one of six unresolved GEO claims, and backlinks may still matter indirectly by helping a page get indexed and read in the first place.")],
    related=[_R_035, _R_038, _R_044],
    cta_h="See how often your brand gets mentioned, not just linked",
    cta_p="Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card.",
    body="""  <p>For years, "get more backlinks" was close to a universal answer to almost any visibility question. The one disclosed study that tested backlinks against a plainer signal, whether a brand's name simply shows up across the web, found the plainer signal winning by a wide margin. That is not the same as proving mentions cause citation. It is worth being precise about what the number does and does not say.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a synthesis piece, not new research. It is built on <a href="https://ahrefs.com/blog/ai-brand-visibility-correlations/">Ahrefs' correlation study</a>, published 12 December 2025, which ran a Spearman correlation across 75,000 brands (filtered to Domain Rating above 40 and a top keyword averaging at least 800 monthly searches) against citation in ChatGPT, Google AI Mode and Google AI Overviews. A second, smaller disclosed study, from Search Engine Journal and Victorious, measured a related but different signal and is cited for contrast rather than confirmation. Fully mapped in <a href="/bg-035.html">BG-035</a>. Dated <strong>14 August 2026</strong> for this synthesis pass.</p>
  </div>

  <h2>What Ahrefs actually measured</h2>

  <p>Ahrefs tested five named signals against citation across the three engines: YouTube mentions, branded web mentions, branded anchor text, branded search volume and Domain Rating, plus raw backlink count. Branded web mentions, meaning the brand's name appearing on a page anywhere on the web, correlated at 0.664 with ChatGPT citation, 0.709 with AI Mode, and 0.656 with AI Overviews, the second-strongest signal tested behind YouTube mentions. Raw backlink count, by contrast, was described only as weak across all three engines, with no specific coefficient published for it. That gap between a named, disclosed number for mentions and an unnamed "weak" for backlinks is itself worth sitting with before drawing a conclusion.</p>

  <h2>0.664 in plain terms</h2>

  <p>A correlation coefficient of 0.664 sits in the range statisticians usually call moderately strong to strong, well short of a perfect 1.0 but far from the near-zero relationship you would expect from two unrelated variables. In practice, it means a brand with a high volume of branded mentions is meaningfully more likely to be cited than a brand with few, and that relationship holds up across a sample of 75,000 brands, not a handful of anecdotes. Squared loosely, 0.664 works out to roughly 0.44, which is a common shorthand for how much of the variation in one variable tracks the other. Read plainly: mentions explain a real, sizable share of what separates a cited brand from an uncited one. They do not explain most of it.</p>

  <h2>What it does not prove</h2>

  <p>Ahrefs is explicit that this is correlation, not causation, and that distinction matters more here than in most GEO findings, because the intuitive causal story is so easy to reach for. A brand could get mentioned more often across the web because it is already large, well known, or genuinely useful to write about, the same underlying qualities that would also make an AI engine more likely to surface it. If that is closer to the truth, then generating mentions on their own, without the underlying relevance or scale behind them, would not move citation the way the correlation might suggest. Nothing in Ahrefs' study isolates which direction the causal arrow runs, and no matched-control test of mention volume exists the way one now exists for schema markup, covered in <a href="/bg-038.html">BG-038</a>, where a direct causal test found no effect despite a real correlation.</p>

  <h2>Unlinked mentions are the actual point</h2>

  <p>The practical takeaway sits less in the size of the number and more in what it measures. A branded web mention does not require a hyperlink to count. A blog post, forum thread, or news article that names a brand without linking to its site still registered in this correlation, and it outperformed raw backlink count as a signal. That reframes a common GEO instinct: chasing a link back to your own domain may matter less for citation than simply being talked about by name, in whatever form that takes. <a href="/bg-044.html">How each engine actually retrieves sources differs enough</a> that the exact mechanism behind this pattern likely varies by platform, but the directional signal, mentions over backlinks, held across all three engines Ahrefs tested.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Brand mentions correlated more strongly with AI citation than raw backlinks did, in the one disclosed study built to compare them directly. That is real evidence worth weighing. It is not proof that generating more mentions, on their own, will move your citation rate, because the same study cannot separate a brand that gets mentioned because it is genuinely relevant from a brand that would get cited anyway. Treat the number as a signal worth tracking, not a lever confirmed to work when pulled.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-076
ARTICLES.append(dict(
    slug="bg-076", bid="BG-076", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["AI Citation", "Original Research", "Content Strategy"],
    title="Only 28 Percent of AI Answers Combine a Mention With a Citation",
    h1="Only <em>28 Percent</em> of AI Answers Combine a Mention With a Citation",
    h1_plain="Only 28 Percent of AI Answers Combine a Mention With a Citation",
    subtitle="A mention and a citation are two different events, and most brands get one without the other. Here is the two-signal gap, what the disclosed research actually shows about it, and where that leaves a widely repeated recurrence figure that this pass could not verify.",
    meta_desc="Brand mentions and formal citations rarely land together in the same AI answer. What the disclosed research shows about the mention-citation gap, and an honest look at a widely repeated 28% figure this research could not verify.",
    og_desc="A mention is your name in the text. A citation is a source attached to it. Most brands that show up in an AI answer get one signal, rarely both. What the disclosed data shows about that gap, and what a repeated industry figure gets right and wrong.",
    ld_desc="An analysis of the gap between being mentioned and being formally cited in AI engine answers, distinguishing disclosed-methodology findings from a widely circulated but unverified recurrence figure.",
    keywords="ai mention vs citation gap, brand mention and citation together, ai citation recurrence, how to get cited not just mentioned, two signal gap ai search, GEO mention citation strategy",
    about=["AI Citation Research", "Generative Engine Optimization", "Content Strategy", "Methodology Transparency"],
    findings=[("~28%", "a widely repeated industry estimate for how often an AI answer that mentions a brand also carries a formal citation for it, unverified in this research pass"),
              ("99.99%", "of the 49,391 citations Search Engine Journal and Victorious logged pointed to third-party domains, not the brand being discussed, a disclosed measure of how rarely a brand is its own citation source"),
              ("4 of 150", "brands, out of 150 tracked, that earned any self-citation at all in category-research answers, per the same disclosed study"),
              ("55%", "the share of Claude responses that cite a source at all, the lowest of three engines Muck Rack measured, versus 96% for ChatGPT")],
    faq=[("What is the difference between an AI mention and an AI citation?",
          "A mention is your brand's name appearing somewhere in the answer's text. A citation is a source, usually a link or an attributed reference, attached to a specific claim. An engine can name a brand in passing with no source behind it, or attach a citation to a claim without naming the brand plainly in the surrounding sentence. They are two separate events that frequently do not land together."),
         ("Is the 28% figure for mention-and-citation overlap a real, disclosed statistic?",
          "This research pass could not trace it to a named study, sample size, or date range. It circulates in GEO-industry commentary the way several other precise-sounding figures do, and BG-038 covers a similar pattern with a different claim. Treat it as a repeated estimate, not a verified fact, until a disclosed source surfaces."),
         ("What does the disclosed research actually show about the mention-citation gap?",
          "It shows the gap is real and large, even without the specific 28% figure. Search Engine Journal and Victorious found 99.99% of logged citations pointed to third-party domains rather than the brand itself, and only 4 of 150 tracked brands earned any self-citation in category-research answers. Muck Rack found citation rates vary sharply by engine, from 96% of ChatGPT responses down to 55% of Claude's, meaning even the citation half of the pair is inconsistent before mention is factored in at all."),
         ("How should a brand act on the mention-citation gap without a precise recurrence number?",
          "Treat earning a citation-worthy structure, a specific claim next to real supporting evidence, as a separate goal from simply getting named. Most content earns a mention or a citation, rarely both together, so a page built only to be mentioned in passing is leaving the stronger signal on the table.")],
    related=[_R_035, _R_038, _R_044],
    cta_h="Check whether you're mentioned, cited, or both",
    cta_p="Run your domain through the same engines this research covers and see whether your answers carry a name only or a source too. The method is disclosed on screen every time.",
    body="""  <p>Being named in an AI answer and being cited for a specific claim inside one are treated as the same win in most GEO advice. They are not the same event, and the disclosed research on how often they actually land together tells a more useful, and more honest, story than a single clean percentage.</p>

  <div class="callout">
    <div class="callout-label">How this was researched, and a flag worth reading before the rest of this piece</div>
    <p>One specific figure circulating in GEO-industry commentary holds that a brand earning both a mention and a citation in the same answer sees roughly 40% higher recurrence in future answers, but that only about 28% of answers carrying a mention also carry a citation. Neither number traces to a named study, a stated sample size, or a disclosed date range in the research available for this piece, and it should be treated the same way BG-038 treats other precise-sounding, unsourced GEO claims: repeated often, verified nowhere. What follows grounds the real shape of this gap in two studies that do disclose their method, <a href="https://www.searchenginejournal.com/ai-brand-mention-study-victorious-spa/582765/">Search Engine Journal and Victorious's 175-brand study</a> and <a href="https://muckrack.com/blog/what-is-ai-reading-may-2026">Muck Rack's Generative Pulse</a>, published May 2026 on 25 million or more links. Dated <strong>14 August 2026</strong> for this pass.</p>
  </div>

  <h2>Two different signals, not one</h2>

  <p>A mention is a name appearing in the text of an answer. A citation is a source, a link or an attribution, tied to a specific claim. An engine can do either without the other: name a brand in a sentence with nothing backing it up, or attach a citation to a fact without ever naming the brand plainly nearby. Most GEO advice talks about "getting mentioned by AI" as a single outcome, which flattens a distinction the disclosed data treats as real and consequential.</p>

  <h2>The two-signal gap, measured where it can be measured</h2>

  <p>Search Engine Journal and Victorious logged 49,391 citations across 175 brands and eight platforms and found 99.99% of them pointed to a third-party domain rather than the brand's own site. Only 4 of the 150 brands they tracked earned any self-citation at all in category-research answers, the kind of prompt a real buyer would type with no brand name in it. That is a strong, disclosed signal that citation and mention rarely converge on the brand itself as the source, even before asking how often the two signals appear together at all.</p>

  <p>Muck Rack's citation-rate data adds a second dimension to the same gap. ChatGPT cites a source in 96% of its responses. Gemini cites in 82%. Claude cites in just 55%, meaning nearly half of Claude's answers carry no citation of any kind, regardless of whether a brand was mentioned. If your content strategy assumes citation is a reliable companion to mention, that ceiling is meaningfully lower on Claude before anything about your own content is a factor.</p>

  <h2>Why treating this as one initiative undersells both</h2>

  <p>The practical read, independent of the specific 28% figure, is that mentions and citations respond to different things. A brand gets mentioned because it is relevant, well known, or fits the shape of the answer. A brand gets cited because a specific page carried a claim precise enough, and structured clearly enough, for an engine's retrieval mechanism to attach a source to it, a pattern <a href="/bg-035.html">BG-035's map of disclosed citation research</a> covers across five separate studies. Content built to maximize recognition, being named accurately when asked directly, does not automatically produce citable structure, and content built for citable structure does not automatically get a brand named plainly in the surrounding prose. Treating the two as one combined initiative risks optimizing for whichever one is easier to measure and quietly neglecting the other.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>The precise 28% figure did not survive this research pass with a disclosed source behind it, and it is reported here as exactly what it is, a widely repeated estimate rather than a verified finding. What the disclosed research does support is the shape underneath that claim: mentions and citations are separate events, most brands earn one without the other, and the brands earning both consistently are rare enough that Search Engine Journal and Victorious found only 4 out of 150 tracked brands doing it at all. That gap is the real opportunity, whatever the exact percentage turns out to be once someone discloses how they measured it.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-077
ARTICLES.append(dict(
    slug="bg-077", bid="BG-077", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Google AI Overviews", "AI Search Trends", "Original Research"],
    title="AI Overviews Cut Organic Click-Through by Nearly 60 Percent. The Citation Payoff Is Less Clear.",
    h1="AI Overviews Cut Organic Click-Through by <em>Nearly 60 Percent</em>. The Citation Payoff Is Less Clear.",
    h1_plain="AI Overviews Cut Organic Click-Through by Nearly 60 Percent. The Citation Payoff Is Less Clear.",
    subtitle="Two separate disclosed analyses put the click-through drop in the same neighborhood but not at the same number. A widely repeated claim that citation protects the clicks you have left could not be traced to a disclosed source in this pass.",
    meta_desc="Two disclosed analyses put AI Overviews' organic click-through drop near 58-60%. What the data actually shows, and an honest look at the unverified claim that being cited protects more of the remaining clicks.",
    og_desc="Similarweb-based tracking puts the drop on the #1 organic spot at 58%. SparkToro's own panel data calls it nearly 60%. Two real, disclosed numbers, not quite the same study. The claim that citation protects your remaining clicks is a separate, unverified question.",
    ld_desc="A comparison of two disclosed analyses measuring organic click-through decline on AI-Overview-triggering queries, with an assessment of a widely circulated but unverified claim about citation's protective effect on remaining click volume.",
    keywords="ai overviews ctr impact 2026, ai overviews click through rate, does ai overview citation help clicks, zero click search 2026, google ai overviews traffic loss, AI Overviews CTR study",
    about=["Google AI Overviews", "AI Search Trends", "Methodology Transparency"],
    findings=[("58%", "click-through drop measured on the #1 organic position for AI-Overview-triggering queries, per Similarweb-based tracking, up from 34.5% a year earlier"),
              ("Nearly 60%", "the click-through reduction SparkToro's own Similarweb-panel analysis attributes to AI Overviews appearing on a search, a close but separately sourced figure"),
              ("68.01%", "the overall share of Google searches ending with no click at all in the first four months of 2026, per SparkToro's disclosed panel methodology"),
              ("Unverified", "the specific claim that a cited brand retains roughly 35% more of the remaining clicks than an uncited competitor on the same query; no disclosed study behind it surfaced in this research pass")],
    faq=[("How much do AI Overviews reduce organic click-through?",
          "By close to 60%, on the two disclosed analyses available. Similarweb-based tracking already covered in BG-043 puts the drop on the #1 organic position at 58%, up from a measured 34.5% drop in April 2025. SparkToro, working from its own Similarweb desktop-and-mobile panel data for January to April 2026, separately describes AI Overviews cutting click-through by nearly 60% on queries where they appear. The two are close but not the same study, and reporting them as one identical figure would overstate how tightly they agree."),
         ("Does being cited in an AI Overview protect a brand's click-through rate?",
          "This is the part of the claim this research pass could not verify. A figure suggesting cited brands retain roughly 35% more of the remaining clicks than uncited competitors circulates in GEO commentary, but no disclosed sample, date range, or named study behind it surfaced here. Treat it as a plausible, unproven claim rather than a measured fact until a source discloses its method."),
         ("Are the different AI Overviews CTR figures measuring the same thing?",
          "Not exactly. Similarweb-based tracking measures the drop specifically on the number one organic position when an AI Overview appears. SparkToro measures overall click-through change across a broader panel and a defined date window, January to April 2026, alongside a wider zero-click figure of 68.01% for all Google searches in that period. Both are disclosed and both point the same direction, but citing one as if it proves the other's specific number would be more precise than the underlying data supports."),
         ("What should a brand actually do given the CTR decline?",
          "Treat organic click-through as a shrinking asset on any query that reliably triggers an AI Overview, and treat citation inside the answer itself as the more direct target, even though its exact payoff in retained clicks is not yet a measured, disclosed number. Checking whether your brand is cited at all on your category's core queries is the part of this that is actually verifiable today.")],
    related=[_R_043, _R_039, _R_038],
    cta_h="Find out if you're cited before the click disappears",
    cta_p="Run your domain through the engines behind AI Overviews and Google AI Mode and see whether you're cited on the queries that matter to you. The method is disclosed on screen every time.",
    body="""  <p>The number that gets repeated most about AI Overviews is that organic click-through has collapsed. That part is real and disclosed, twice over, by two different research approaches that land close to each other without being the same measurement. The second half of the argument, that being cited inside the AI Overview protects a meaningful share of the clicks you would otherwise lose, is where this piece has to be more careful, because that specific number did not hold up to a source check.</p>

  <div class="callout">
    <div class="callout-label">How this was researched, and where it stops being verifiable</div>
    <p>The click-through decline draws on two separate disclosed analyses: Similarweb-based tracking, already covered on this site in <a href="/bg-043.html">BG-043</a>, and SparkToro's own analysis built on Similarweb's desktop-and-mobile web panel, covering January to April 2026 in the US market, published 9 June 2026 and updated 18 June 2026. A widely repeated claim that citation protects roughly 35% more of the remaining clicks for a brand appearing inside the AI Overview itself could not be traced to a disclosed sample, date range, or named study in the research available for this piece, and is presented below as exactly that, an unverified industry claim rather than a measured finding. Dated <strong>14 August 2026</strong> for this synthesis pass.</p>
  </div>

  <h2>Two numbers, both real, not quite the same study</h2>

  <p>Similarweb-based tracking, cited in BG-043, puts the click-through drop on the number one organic position at 58% on queries that trigger an AI Overview, up from a measured 34.5% drop in April 2025. SparkToro, working from the same underlying data provider but its own panel methodology, describes AI Overviews cutting click-through by nearly 60% on the queries where they appear, inside a broader analysis finding 68.01% of all Google searches in that window ended without a click at all, up from 60.45% in 2024 and 49% in 2019. These two figures sit close enough to tell the same directional story and far enough apart that reporting them as one identical number would claim more precision than either study actually offers on its own.</p>

  <h2>The trajectory matters as much as the current number</h2>

  <p>Both analyses describe a trend getting worse, not stabilizing. The Similarweb-based tracker shows the drop growing from 34.5% to 58% in roughly a year. SparkToro's broader zero-click figure moved from 49% in 2019 to 60.45% in 2024 to 68.01% by early 2026, and separately found overall traffic share to websites falling about 22% between June 2025 and May 2026. Whatever the exact percentage a reader wants to anchor on, the direction is consistent across both disclosed sources: the click is worth less than it was a year ago, and the trend line has not leveled off.</p>

  <h2>The claim this research could not confirm</h2>

  <p>A specific figure, that a brand cited inside the AI Overview retains roughly 35% more of the remaining click volume than an uncited competitor on the same query, is the natural next question anyone reading the numbers above would ask. It is also the part of this piece where honesty requires stopping. No disclosed study, sample size, or date range behind that specific figure surfaced in this research pass, and presenting it as fact would repeat exactly the pattern <a href="/bg-038.html">BG-038 catalogs</a> across a different set of unverified GEO claims: a plausible-sounding number with nobody able to point at where it came from.</p>

  <h2>What is actually actionable here</h2>

  <p>The disclosed part of this story is enough on its own to justify attention: the click on the number one organic result is worth roughly half of what it was worth thirteen months ago on queries that trigger an AI Overview, and that decline is accelerating rather than settling. Whether citation inside the answer meaningfully offsets that loss is a real, important question that the industry has not yet answered with disclosed data. Checking whether you are cited at all, on the queries where your category actually shows an AI Overview, is the verifiable step available today, independent of what the eventual, disclosed answer to the retention question turns out to be.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Two separately sourced analyses agree that AI Overviews have cut organic click-through by somewhere close to 60% on the queries where they appear, and that the trend is still moving in the wrong direction for anyone relying on the old click. Whether citation buys back a specific share of what is lost is a claim worth testing, not a number worth repeating until someone discloses how it was measured.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-078
ARTICLES.append(dict(
    slug="bg-078", bid="BG-078", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Market Analysis", "Competitive Landscape", "Methodology Transparency"],
    title="GEO Market Size Estimates Disagree by 36 Percent",
    h1="GEO Market Size Estimates Disagree by <em>36 Percent</em>",
    h1_plain="GEO Market Size Estimates Disagree by 36 Percent",
    subtitle="Three market-research reports put the 2026 global GEO market at $1.09 billion, $1.48 billion, and roughly $848 million a year earlier. None of them disclose a methodology that would let you check the number yourself.",
    meta_desc="Three 2026 GEO market-size estimates, $1.09B, $1.48B and roughly $848M, disagree by up to 36% for the same category. Why market sizing is this unreliable for GEO, and what to do about a vendor's TAM slide.",
    og_desc="$1,089.3 million. $1.48 billion. Roughly $848 million a year earlier. Three real reports, three different 2026 GEO market sizes, none of them independently verifiable. Here is why, and what it means before you trust a vendor's growth pitch.",
    ld_desc="A comparison of three disagreeing 2026 GEO market-size estimates from independent market-research firms, examining why category sizing is unreliable this early and what buyers should do with a vendor-supplied TAM figure.",
    keywords="geo market size 2026, generative engine optimization market size, AI visibility market size, GEO TAM estimate, how big is the GEO market, AI search optimization market forecast",
    about=["Market Analysis", "Generative Engine Optimization", "Competitive Landscape", "Methodology Transparency"],
    findings=[("36%", "the spread between the highest and lowest 2026 global GEO market-size estimates found in this research pass"),
              ("$1,089.3M", "Dimension Market Research's 2026 global GEO market estimate, the middle figure of three found"),
              ("$1.48B", "a separate report's 2026 global estimate, projecting to $17.02 billion by 2034"),
              ("$848M", "a third report's 2025 base-year estimate, projecting to roughly $19.8 billion by 2034")],
    faq=[("How big is the GEO market in 2026?",
          "Depending on which report you read, somewhere between roughly $848 million and $1.48 billion, a spread of up to 36% for the same reported year. Dimension Market Research puts the global 2026 figure at $1,089.3 million with a 40.6% CAGR through 2034. A separate report puts 2026 at $1.48 billion, growing to $17.02 billion by 2034 at 45.5% CAGR. A third puts the 2025 base year at $848 million, projecting to roughly $19.8 billion by 2034 at 50.5% CAGR from 2026 onward."),
         ("Why do market-size estimates for GEO disagree so much?",
          "Because the category is roughly two years old, has no shared definition of what counts as GEO spend, and no historical baseline to extrapolate a trend line from the way an established market would have. Different analysts also make different calls about whether to count adjacent SEO-platform revenue, the kind Semrush or Ahrefs earns from an AI-visibility add-on bundled into an existing subscription, as GEO spend or as SEO spend that happens to include a new feature."),
         ("Are any of these market-size figures from Gartner or Forrester?",
          "Not the specific dollar figures. None of the three reports found in this research pass read as Gartner or Forrester primary research, they read as independent market-research-report vendors selling a full paywalled PDF behind a public summary page, and their underlying methodology could not be verified from the available search results. Forrester has published AEO guidance and a cited B2B traffic-share statistic, but not a competing GEO market-size dollar figure that this pass could locate."),
         ("Should I cite a specific GEO market-size number in a pitch or a report?",
          "Only with the caveat attached that it is one estimate among several that disagree by more than a third for the same year, and only after checking whether the vendor supplying it discloses a methodology you could actually audit. A single clean number, stated without that caveat, implies a precision this category's own published research does not yet support.")],
    related=[_R_042, _R_036, _R_040],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Ask three market-research firms how big the GEO category is in 2026 and you get three different answers, and not by a rounding margin. The spread is large enough, and the underlying methodology opaque enough, that citing any single figure as settled fact would claim more precision than this category's own published research actually offers.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>14 August 2026</strong>. Three global 2026 GEO market-size figures were located: <a href="https://dimensionmarketresearch.com/report/generative-engine-optimization-geo-market/">Dimension Market Research's $1,089.3 million estimate</a>, a separate report citing $1.48 billion for 2026 growing to $17.02 billion by 2034, and a third citing $848 million for a 2025 base year growing to roughly $19.8 billion by 2034. None of the three appear to be Gartner or Forrester primary research, and none disclosed a methodology detailed enough to independently audit from the publicly available summary pages, a genuinely different standard than the disclosed-sample studies this site otherwise prefers to cite, and stated here plainly rather than smoothed over.</p>
  </div>

  <h2>Three numbers, one year, a 36% spread</h2>

  <p>Dimension Market Research puts the global GEO market at $1,089.3 million in 2026, projecting a 40.6% compound annual growth rate through 2034, and separately sizes the US market specifically at $365.4 million in 2026 with a 42.9% CAGR. A different report, surfaced in the same research pass, puts the 2026 global figure at $1.48 billion, growing to $17.02 billion by 2034 at a 45.5% CAGR, a base-year number roughly 36% higher than Dimension's for the identical year. A third report sizes 2025 at $848 million, projecting to approximately $19.8 billion by 2034 at a 50.5% CAGR from 2026 onward. Line up all three and there is no way to average them into one defensible number, because they are not obviously measuring the same thing to begin with.</p>

  <h2>Why a category this new cannot be sized precisely yet</h2>

  <p>Three structural reasons explain most of the gap. First, there is no shared industry definition of what counts as "GEO spend." A brand paying for Semrush's AI Visibility Toolkit, bundled into an existing subscription, is spending money that could reasonably be counted as SEO-platform revenue that happens to include a newer feature, or as GEO revenue proper, depending entirely on which analyst is doing the counting. <a href="/bg-040.html">Every legacy SEO platform checked in a separate research pass</a> extended an existing keyword database or SERP-scraping pipeline into AI-answer tracking rather than building dedicated infrastructure from scratch, which makes the boundary between "SEO tooling" and "GEO tooling" genuinely blurry at the revenue-attribution level, not just a marketing distinction.</p>

  <p>Second, the category has essentially no historical baseline. A market-sizing model for an established software category can extrapolate from several years of real revenue data. GEO-native vendors as a group did not exist as funded businesses before 2023 or 2024, so any 2026 estimate rests on a very short runway of actual observed spend, and a small early difference in assumed growth rate compounds into a large disagreement by the time the model reaches 2034. Third, none of the three reports found in this pass discloses a methodology detailed enough to check independently, no stated sample of companies surveyed, no disclosed definition of the market boundary, no visible calculation from a smaller verified figure up to the headline number. That is a meaningfully different transparency standard than the disclosed-sample studies BG-035 maps for citation research, and it is worth naming the difference plainly rather than citing a market-size figure with the same confidence.</p>

  <h2>What to actually do with a GEO market-size number</h2>

  <p>Two practical rules follow directly from the spread. Do not cite a single GEO market-size figure in a pitch, a report, or a piece of content as if it were a precise, agreed-upon number, because the category's own published research has not agreed on it. And do not let a vendor's inflated total addressable market slide be the basis for a purchase decision, since a sales deck citing the highest of several disagreeing figures, without disclosing that the estimates diverge by more than a third, is presenting a selectively chosen number as settled fact. If a number matters to a real decision, ask where it came from and whether the answer includes a disclosed sample and a stated methodology, the same bar this site applies to every citation-correlation study it covers.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Somewhere between roughly $848 million and $1.48 billion for 2026, depending entirely on which report you trust, is the honest current state of GEO market sizing. That range itself, not any single number inside it, is the useful fact: a category this early, with no shared spend definition and no real historical baseline, has not produced a market-size figure worth repeating as precise. Treat "this is a fast-growing, early-stage category" as the defensible claim, and treat any specific dollar figure attached to it as illustrative, not authoritative.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-079
ARTICLES.append(dict(
    slug="bg-079", bid="BG-079", date="2026-08-14", date_label="August 14, 2026", read=8,
    tags=["AI Citation", "Original Research", "Methodology Transparency"],
    title="86 Percent of AI Citations Come From a Brand's Own Website, Not Earned Media",
    h1="86 Percent of AI Citations Come From a Brand's Own Website, <em>Not Earned Media</em>",
    h1_plain="86 Percent of AI Citations Come From a Brand's Own Website, Not Earned Media",
    subtitle="Yext's study of 6.8 million citations found owned sources dominating. This site's own BG-035 already cites Muck Rack's finding that earned media accounts for 84% of citations. Both are disclosed. They point in opposite directions, and this piece does not paper over that.",
    meta_desc="Yext's 6.8-million-citation study found 86% of AI citations come from brand-owned sources, apparently contradicting Muck Rack's 84%-earned-media finding already cited on this site. Both studies examined, and the likely reasons they diverge.",
    og_desc="One disclosed study says 86% of AI citations come from a brand's own website and listings. Another disclosed study, already cited on this site, says 84% come from earned media instead. Both are real. Here is why they probably do not agree.",
    ld_desc="A comparison of two disclosed studies reaching apparently opposite conclusions about whether AI citations trace mostly to owned brand properties or to earned third-party media, examining the likely methodological reasons for the divergence.",
    keywords="ai citation sources owned vs earned media, does earned media matter for ai search, yext ai citation study, owned media ai search, brand website ai citations, GEO earned vs owned content",
    about=["AI Citation Research", "Generative Engine Optimization", "Methodology Transparency", "Content Strategy"],
    findings=[("86%", "of 6.8 million AI citations traced to sources Yext classifies as brand controlled, website plus business listings, per its disclosed study"),
              ("84%", "of AI citations Muck Rack's separate, disclosed 25-million-link study attributes to earned media instead, a figure BG-035 already cites"),
              ("99.99%", "of citations Search Engine Journal and Victorious logged pointed to third-party domains, a third disclosed study that agrees with Muck Rack's direction, not Yext's"),
              ("42%", "of Yext's owned-source citations attributed specifically to business listings, pages hosted on third-party platforms like Google Business Profile that a brand nonetheless controls the content of")],
    faq=[("Do most AI citations come from a brand's own website or from earned media?",
          "The disclosed research genuinely disagrees, and this piece states that plainly rather than picking a side. Yext's study of 6.8 million citations found 86% traced to sources it classifies as brand controlled, while Muck Rack's separate 25-million-link study found 84% traced to earned media instead, and Search Engine Journal and Victorious's 175-brand study found 99.99% of citations pointed to third-party domains. Two disclosed large-sample studies point toward earned media dominating; one disclosed large-sample study points the other way."),
         ("Why do these studies disagree so sharply?",
          "The most likely reason is definitional. Yext's 86% figure combines a brand's own website (44%) with business listings (42%), and a business listing on Google Business Profile or a similar platform is technically hosted on a third-party domain even though the brand edits its content directly. Muck Rack and Search Engine Journal and Victorious appear to classify citation source more strictly by domain ownership, which would count that same listing as third-party. Different query mixes and different engine sets across the three studies are also plausible contributing factors, and this piece does not claim to have fully resolved the gap."),
         ("Does this mean earned media does not matter for AI search?",
          "No. Even under Yext's more inclusive definition of owned sources, reviews and social content, the most clearly earned category in its breakdown, still accounted for real citation volume, and two of the three disclosed studies covered here put earned media as the dominant source by a wide margin. The honest position is that owned content clearly matters more in Yext's framing than in Muck Rack's, not that earned media is irrelevant in either one."),
         ("Which of these two studies should I trust more?",
          "Both disclose a real sample size, date range and method, which is the bar this site applies before treating a statistic as credible, so neither should be dismissed outright. Where they conflict this sharply, the more useful move is to understand why they might be measuring different things, covered above, rather than picking whichever number better supports a strategy you already wanted to run.")],
    related=[_R_035, _R_043, _R_044],
    cta_h="Check which sources are actually citing you",
    cta_p="Run your domain through the same engines this research covers and see whether your citations trace back to your own site, a listing, or coverage elsewhere. The method is disclosed on screen every time.",
    body="""  <p>Two disclosed studies, both with real sample sizes in the millions, looked at the same basic question, where do AI citations actually come from, and reached close to opposite headline numbers. This site already covers one of them. It would be easy to quietly let the newer study override the older one, or to ignore the conflict entirely. Neither is honest, so this piece states both numbers plainly and works through the most likely reason they diverge.</p>

  <div class="callout">
    <div class="callout-label">How this was researched, and the contradiction this piece exists to address</div>
    <p><a href="/bg-035.html">BG-035, already published on this site</a>, cites <a href="https://muckrack.com/blog/what-is-ai-reading-may-2026">Muck Rack's Generative Pulse</a>, a 25-million-plus-link study across ChatGPT, Claude and Gemini in 17 industries, three editions since July 2025, most recent May 2026: earned media accounts for 84% of all AI citations, stable in an 82-89% range across editions. Separately, <a href="https://www.businesswire.com/news/home/20251009106549/en/Yext-Research-86-of-AI-Citations-Come-from-Brand-Managed-Sources-Clarifying-How-Marketers-Can-Compete-in-the-AI-Search-Era">Yext's study</a>, published 9 October 2025 and recapped in a January 2026 blog post, analyzed 6.8 million AI citations from 1.6 million queries per model across ChatGPT, Gemini and Perplexity, between 1 July and 31 August 2025, across four intent quadrants and four industries (retail, financial services, healthcare, food service): 86% of citations traced to sources it classifies as brand controlled. Both studies disclose a sample size, date range and named method. They still do not agree, and this piece does not force a resolution neither study earns on its own.</p>
  </div>

  <h2>What Yext actually found</h2>

  <p>Yext's 86% figure splits into two components: websites accounted for 44% of citations (2.9 million), and business listings accounted for a separate 42% (also roughly 2.9 million). Reviews and social content, the category closest to what most people mean by earned media, contributed only 8% (545,000 citations). Yext's own framing describes this as cutting against a common assumption that earned coverage or forums like Reddit drive most AI citations, and the study's stated conclusion is that brands should invest in the sources they already control rather than assuming third-party coverage is the primary lever.</p>

  <h2>What Muck Rack, and a third study, found instead</h2>

  <p>Muck Rack's number points the opposite direction just as firmly: earned media, journalism alone accounting for 25 to 27% of it, drives 84% of citations, while paid or advertorial content is essentially never cited, at 0.3%. A third disclosed study adds weight to Muck Rack's side of the disagreement rather than Yext's: Search Engine Journal and Victorious, covering 175 brands across eight platforms and 49,391 logged citations, found 99.99% pointed to third-party domains, and only 4 of 150 tracked brands earned any self-citation in category-research answers at all. Counted by disclosed large-sample study, two point toward earned and third-party sources dominating, one points toward owned sources dominating.</p>

  <h2>The most likely reason they diverge</h2>

  <p>The strongest candidate explanation is definitional, not a flaw in either study. Yext's "brand controlled" category folds business listings, pages on platforms like Google Business Profile, Yelp or similar directories, into the owned bucket, on the reasoning that a brand edits the content of its own listing directly even though the listing itself lives on someone else's domain. Muck Rack and Search Engine Journal/Victorious appear to classify a citation's source more strictly by which domain the URL actually points to, which would put that same business-listing citation into the third-party or earned bucket instead. Under that reading, Yext's real strictly-owned-domain figure is closer to 44%, still meaningfully higher than what Muck Rack's framing implies for owned sources, but a smaller gap than the headline 86-versus-84 comparison suggests.</p>

  <p>Two secondary factors likely compound the gap. Yext's four industries, retail, financial services, healthcare and food service, skew toward local and transactional queries where structured listing data, hours, locations, service areas, is exactly the kind of content these engines pull directly, while Muck Rack's broader 17-industry, journalism-heavy corpus reflects a more informational query mix. The two studies also cover different time windows and different engine sets, Yext's July to August 2025 against Muck Rack's rolling editions through May 2026, and <a href="/bg-043.html">Google's own May 2026 AI Overviews overhaul</a> specifically added a block pulling from forums, social platforms and reviews, a change that would plausibly shift later measurements further toward third-party sources than an earlier one. None of these factors, on their own or combined, fully closes a 40-plus point gap, and this piece is not claiming they do.</p>

  <h2>What this means in practice</h2>

  <p>A brand should not read either number as license to ignore the other type of source. Even in Yext's framing, where owned properties dominate the headline, the specific subcategory closest to pure earned media, reviews and social, still carried real citation volume. And even in Muck Rack's framing, where earned media dominates, a brand's own website and listings are not reported at zero. The honest, unresolved state of this question is that owned content appears to matter more than the earned-media-dominant narrative usually allows, at least under one disclosed study's definitions, while two other disclosed studies suggest the opposite weighting. Both are worth investing in. Neither study licenses ignoring the other.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>This is not a case where one study is right and the other is wrong. Yext and Muck Rack, plus Search Engine Journal and Victorious, all disclose real methodology and reach genuinely different conclusions about where AI citations originate, most plausibly because they are drawing the line between "owned" and "earned" in different places and measuring different query mixes across different time windows. Presenting a single one of these numbers as the settled answer, in either direction, would be less honest than showing the disagreement and explaining why it most likely exists.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-080
ARTICLES.append(dict(
    slug="bg-080", bid="BG-080", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["How To", "Content Strategy", "GEO Playbook"],
    title="A 90-Day Content Calendar Built Around What Actually Gets AI Citations",
    h1="A 90-Day Content Calendar Built Around <em>What Actually Gets AI Citations</em>",
    h1_plain="A 90-Day Content Calendar Built Around What Actually Gets AI Citations",
    subtitle="Three dated phases, not another checklist: 30 days to audit and fix what is broken, 30 days to earn what the disclosed research says actually correlates with citation, 30 days to re-measure and decide what to keep doing.",
    meta_desc="A dated 90-day GEO content calendar: Days 1-30 audit and fix, 31-60 earn citations, 61-90 re-measure. Built on disclosed studies already published, not another generic checklist.",
    og_desc="Not a checklist. A calendar. Thirty days to find out where you actually stand, thirty to do the three things the disclosed research says correlate with citation, thirty to check if any of it moved.",
    ld_desc="A phased 90-day content calendar for generative engine optimization, sequencing an audit, an earned-media push, and a re-measurement window, each phase traced to disclosed research already published on this site.",
    keywords="geo content calendar, 90 day ai search visibility plan, GEO content strategy schedule, AI visibility action plan, how to plan a GEO content calendar, generative engine optimization roadmap",
    about=["Generative Engine Optimization", "Content Strategy", "AI Visibility Measurement", "Original Research Synthesis"],
    findings=[("30", "days budgeted for the audit and fix phase before any new content or outreach begins"),
              ("84%", "share of AI citations tracing to earned media, the finding Days 31 to 60 are built around, per BG-035"),
              ("<1 in 100", "chance a single measurement run repeats itself, the reason Days 61 to 90 exist as a phase and not one final check"),
              ("3", "phases, each with a stated exit condition instead of a fixed task list")],
    faq=[("Is this calendar different from BrandGEO's existing GEO playbook and checklist?",
          "Yes, deliberately. BG-052 explains the reasoning behind nine recommendations and BG-054 compresses them into a checklist; neither is dated. This piece takes the same underlying findings and puts them on a 90-day schedule with a start date, an end date, and an exit condition for each phase, which a playbook or a checklist is not built to do."),
         ("Do I need to finish Days 1 to 30 before starting anything else?",
          "The audit and fix phase is meant to run first because it produces the baseline the later phases compare against. Earning third-party mentions in Days 31 to 60 without a documented Day 30 baseline means Days 61 to 90 have nothing honest to measure against."),
         ("What if 90 days isn't enough to see a change?",
          "It may not be, and this calendar does not promise otherwise. Seer Interactive's research found sustained citation tracks pages with a median age around six months, not new pages, so a 90-day window is realistically enough to establish a baseline and start the earning phase, not necessarily enough to prove a lasting citation gain. Treat Day 90 as a checkpoint, not a finish line."),
         ("Can I skip the audit and go straight to outreach?",
          "You can, but you would be spending the higher-effort phase, PR and community outreach, without knowing what your starting point actually was. The audit is the cheaper phase to run, and it is what makes Days 61 to 90 mean anything.")],
    related=[("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
              "The reasoning behind Days 31 to 60, spelled out recommendation by recommendation rather than scheduled."),
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "The reference list this calendar's Day 1 to 30 fixes are pulled from, item by item."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The exact method this calendar's audit weeks and its Day 90 re-check both run.")],
    cta_h="Start Day 1 with a real baseline", cta_p="Run your domain across up to seven engines before you plan anything else. You get the answer on screen in about a minute, with no signup and no card, so Day 1 of this calendar costs you nothing to start.",
    body="""  <p>This site already has a playbook and a checklist for getting cited by AI engines. Both are good at what they do and neither tells you when to do anything. <a href="/bg-052.html">BG-052</a> explains the reasoning behind nine recommendations. <a href="/bg-054.html">BG-054</a> compresses them into eight items you could read in two minutes. What's missing from both, and from most GEO content generally, is a calendar: what to do in week one versus week nine, and how to know when a phase is actually finished. This is that calendar, built on the same disclosed findings those two pieces already cite, arranged by date instead of by priority.</p>

  <div class="callout">
    <div class="callout-label">How this was built</div>
    <p>This is a synthesis and scheduling piece, not new research. Every recommendation inside each phase traces to a finding already published and sourced on this site: the audit method in Days 1 to 30 is BG-053's method, run as written; the earning tactics in Days 31 to 60 are drawn from BG-052's recommendations one and two; the re-measurement logic in Days 61 to 90 leans on BG-037's coverage of run-to-run inconsistency. Dated 14 August 2026 for this synthesis pass.</p>
  </div>

  <h2>Days 1 to 30: audit what you have, fix what is broken</h2>

  <p>Spend the first two weeks running <a href="/bg-053.html">BG-053's self-audit method</a> across your most commercially important prompts, not your brand name alone: a direct-brand question and a handful of category questions a real buyer would type, run more than once across separate days rather than once and trusted. Write down, per engine, whether you're mentioned, whether you're cited with a real source or just named in passing, and whether the facts attached to you are correct. This is the baseline the rest of the calendar compares against, so skipping it doesn't save time later, it just means Day 90 has nothing honest to measure against.</p>

  <p>Use weeks three and four to fix what the audit turned up that's actually broken, not to chase a citation directly. That means checking the technical items from <a href="/bg-054.html">BG-054's checklist</a> that are within your control this month: whether your best-performing older pages are stale, whether specific claims sit next to the source that backs them rather than bundled into a references section, and whether your existing schema markup is at least correctly formed even though the disclosed research shows adding schema does not, on its own, move citation numbers. Fixing what's broken is hygiene. It is not the lever that gets you cited, and this calendar does not pretend otherwise.</p>

  <h2>Days 31 to 60: earn what the disclosed research says actually correlates</h2>

  <p>This is the phase most GEO advice skips straight to, and it's the one with the strongest disclosed evidence behind it. Muck Rack's 25 million link study found earned media accounts for 84% of all AI citations, with paid or advertorial content essentially never cited, per <a href="/bg-052.html">BG-052's first recommendation</a>. Ahrefs' 75,000 brand correlation study found YouTube mentions correlate strongest with citation across the three engines it tested, ahead of branded web mentions and backlinks, per the same piece's second recommendation. Neither finding is causal, and both articles say so plainly. What that means for this thirty day window is concrete: spend it on the outreach that earns a third party mention, whether that's a journalist, an industry forum thread, a community answer, or a YouTube video that names you, rather than a fourth blog post on your own site restating what you already publish.</p>

  <p>Budget this phase in weeks, not a single push: week one for a target list of publications, forums, and creators worth reaching; weeks two and three for the actual outreach; week four for whatever earned coverage lands, plus a note on what didn't. A month is not long enough to guarantee a result on a correlational signal, and this calendar does not claim otherwise.</p>

  <h2>Days 61 to 90: re-measure, and decide what to keep doing</h2>

  <p>Re-run the exact audit from Days 1 to 30, same prompts, same engines, more than one pass. Compare it against the Day 30 baseline. Before drawing any conclusion from the comparison, apply <a href="/bg-037.html">BG-037's consistency finding</a>: SparkToro's study found less than a 1-in-100 chance an AI platform returns the same brand list twice for an identical question, so a single run at Day 90 that looks better or worse than Day 30 could be noise, not a result. What the comparison is actually useful for is direction across multiple runs, not one clean before-and-after number.</p>

  <p>If the direction is positive across several runs, the earning activity from Days 31 to 60 is worth continuing on the same 30-day rhythm. If nothing moved, that's a real finding too, not a failure to hide: it may mean 90 days was too short a window for content that tends to compound over months, per the freshness research cited in <a href="/bg-054.html">BG-054</a>, or it may mean the specific outreach targets weren't the right ones. Either way, the next calendar starts from a documented Day 90 baseline instead of a guess.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A calendar is not a guarantee, and this one doesn't claim to be. What it does is force the sequence that most GEO content skips: know your baseline before you spend on outreach, and treat a single re-check at the end as one data point, not a verdict. Thirty days to know where you stand, thirty to do the two things with the strongest disclosed correlation behind them, thirty to find out honestly whether it moved.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-081
ARTICLES.append(dict(
    slug="bg-081", bid="BG-081", date="2026-08-14", date_label="August 14, 2026", read=5,
    tags=["How To", "Competitive Landscape", "AI Visibility Measurement"],
    title="A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers",
    h1="A 10-Minute Way to Check If Your <em>Competitors Outrank You</em> in AI Answers",
    h1_plain="A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers",
    subtitle="Pick your most commercially important prompts, run each through four engines once, and write down who shows up instead of you. No tool, no signup. Also no trend data, and that limit matters as much as the method itself.",
    meta_desc="A fast manual method for checking if competitors outrank you in ChatGPT, Gemini, Claude and Perplexity: which prompts to run, what to note, and why a single spot check is not ongoing monitoring.",
    og_desc="Ten minutes, four engines, no tool required. Ask the questions a buyer would actually type, see who the AI names instead of you. Then read the honest limit before you draw a conclusion from it.",
    ld_desc="A manual, tool-free method for checking whether competitors are more visible than a brand in AI engine answers, covering prompt selection, run mechanics, and the limits of a single measurement pass.",
    keywords="competitor ai visibility check, how to check if competitors rank higher in chatgpt, check competitors in AI search, AI competitor monitoring manual method, who shows up instead of my brand in AI",
    about=["AI Visibility Measurement", "Competitive Landscape", "Practical Methodology", "Generative Engine Optimization"],
    findings=[("3 to 5", "prompts to run, the commercial questions a real buyer would actually type, not your brand name"),
              ("4", "engines to check in one pass: ChatGPT, Gemini, Claude and Perplexity"),
              ("<1 in 100", "chance a repeat run of the same prompt returns the same list, per SparkToro's study covered in BG-037"),
              ("0", "signup, card, or tool needed to run this once")],
    faq=[("How do I pick the right prompts to test?",
          "Use the commercial question a buyer would type before they've heard of anyone, not your brand name. 'Best project management software for a 50-person agency' tests something real. 'What is Acme Software' only tests whether the engine recognizes you, which almost any brand with a website clears. Three to five of these category prompts, the ones closest to an actual purchase decision, is enough for a first pass."),
         ("What exactly should I write down for each answer?",
          "Whether you appear at all, where in the answer you appear if there's a list, and who appears instead of or ahead of you. Note it per engine and per prompt rather than as one combined impression, since the engines frequently disagree with each other on the same question."),
         ("Is a single 10-minute check as good as ongoing monitoring?",
          "No, and this method doesn't claim to be. SparkToro's study of 2,961 queries found less than a 1-in-100 chance an AI platform returns the same list twice for an identical question, covered in full in BG-037. A single pass tells you what one snapshot looked like on one day. It cannot tell you a trend, and treating it as one is the most common mistake this method invites."),
         ("When does a spot check like this stop being enough?",
          "Once the answer matters for a real decision, whether that's a sales conversation you're about to lose or a budget you're trying to justify. A spot check is a reasonable first look. A recurring, dated comparison across weeks is what actually shows direction, which is a different exercise than this one.")],
    related=[("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The fuller version of this method, aimed at your own brand's answers rather than who appears instead of you."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "The consistency research behind why this method is a spot check, not a measurement, on its own."),
             ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "Why 'outranking' doesn't mean the same thing on each of the four engines this check runs against.")],
    cta_h="Skip the manual version and see it on one screen", cta_p="Our free test runs your commercial prompts across up to seven engines at once and shows who else the answer names. Same idea as the method below, done automatically and repeatably.",
    body="""  <p>You don't need a subscription or a demo call to find out whether a competitor is showing up ahead of you in AI answers. You need about ten minutes, three to five prompts, and four browser tabs. This is the fast version, deliberately manual, deliberately limited, and honest about both of those things before you read past the method itself.</p>

  <div class="callout">
    <div class="callout-label">How this was built</div>
    <p>This is a synthesis piece, not new research. The prompt-selection logic borrows directly from <a href="/bg-053.html">BG-053's self-audit method</a>, narrowed here to a competitive spot check rather than a full brand audit. The consistency caveat in the closing section is drawn from <a href="/bg-037.html">BG-037's coverage of SparkToro's study</a>. Dated 14 August 2026 for this synthesis pass.</p>
  </div>

  <h2>Pick the prompts that matter, not your brand name</h2>

  <p>Write down three to five questions a buyer who has never heard of you would actually type into an AI chat before making a purchase decision in your category. "Best accounting software for a small agency," not "what is Acme Accounting." The category prompt is the harder, more useful test, because it's the one where a competitor gets to take your spot instead of you simply not being recognized at all.</p>

  <h2>Run each prompt through four engines, once</h2>

  <p>ChatGPT, Gemini, Claude and Perplexity, each in a fresh conversation so nothing from a prior chat colors the answer. Paste the same prompt into each, unedited, and read the full response rather than skimming for your own name first.</p>

  <h2>Note who shows up instead of you</h2>

  <p>For each answer, three things: are you mentioned at all, where do you sit if there's a numbered or bulleted list, and specifically who is named ahead of you or in your place. That third column is the point of this exercise. A competitor showing up repeatedly across several prompts and engines, in a spot you'd expect to hold, is worth a closer look. A competitor showing up once, on one engine, might be nothing.</p>

  <h2>What "outranking" actually means here, and why it's fuzzy</h2>

  <p>Unlike a Google results page, none of these four engines produce a stable, numbered ranking to compare against. <a href="/bg-044.html">BG-044's breakdown of engine mechanics</a> covers this in full, but the short version: ChatGPT's citation is closer to binary, present or absent, with no equivalent of a numbered position. A brand appearing third in a Claude list and first in a Perplexity list for the same question isn't a contradiction to resolve, it's two different retrieval systems doing two different things. "Outranking" in this method means showing up where a competitor doesn't, or being named instead of you, not a shared leaderboard position across engines.</p>

  <h2>The honest limit: this is a spot check, not a measurement</h2>

  <p>SparkToro's study of 2,961 queries across three major AI platforms found less than a 1-in-100 chance the same platform returns the same list twice for an identical question, and roughly a 1-in-1,000 chance it returns that list in the same order, covered in full in <a href="/bg-037.html">BG-037</a>. That means the ten minutes you just spent produced one snapshot of one moment, not a trend. If a competitor showed up ahead of you today, running the same prompt tomorrow could look different for reasons that have nothing to do with either of you changing anything. Treat what you found as a reason to look closer, not as a settled result, and if the stakes are real, repeat the check across a few separate days before you act on it.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Ten minutes and four tabs will tell you something today that you didn't know this morning. It will not tell you a trend, and it is not a substitute for checking again next week. Use it as a first look, not a conclusion.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-082
ARTICLES.append(dict(
    slug="bg-082", bid="BG-082", date="2026-08-14", date_label="August 14, 2026", read=9,
    tags=["Original Research", "Academic Research", "AI Citation"],
    title="What the Princeton GEO Paper Actually Tested: All Nine Techniques, Ranked",
    h1="What the Princeton GEO Paper Actually Tested. <em>All Nine Techniques</em>, Ranked",
    h1_plain="What the Princeton GEO Paper Actually Tested: All Nine Techniques, Ranked",
    subtitle="The academic study that named the field is cited constantly and read closely rarely. Here is every one of the nine techniques it tested, individually, with what each one is, whether it helped or hurt, and the study's actual scale and method.",
    meta_desc="Every one of the nine techniques the Princeton/Georgia Tech GEO paper tested, individually ranked, plus the study's real scale, benchmark and metrics, and why its 2023 findings need a 2026 caveat.",
    og_desc="Five techniques worked. Four didn't. This site's other articles mention that in passing. Here is what each of the nine actually is, what the paper measured them against, and how big a synthetic academic benchmark should weigh against 2026 production engines.",
    ld_desc="A detailed breakdown of the nine content optimization techniques tested in the Princeton, Georgia Tech, Allen Institute and IIT Delhi paper that founded generative engine optimization, covering method, scale, and result per technique.",
    keywords="princeton geo paper generative engine optimization study, geo techniques that work academic study, GEO-bench benchmark explained, generative engine optimization academic research, does keyword stuffing help AI search, Princeton AI citation study",
    about=["Generative Engine Optimization", "AI Citation Research", "Academic Research", "Content Strategy"],
    findings=[("9", "content techniques tested, against a benchmark built specifically for this study"),
              ("5", "techniques that produced a real, statistically distinguishable gain"),
              ("41%", "the largest single lift recorded in the paper, from Statistics Addition"),
              ("9,106+", "times the paper had been downloaded as of March 2026, by its own count")],
    faq=[("What is GEO-bench?",
          "The benchmark the paper built to test its nine techniques against: a synthetic query set with a black-box optimization method, not live traffic pulled from a production search engine. It is a controlled academic instrument, built to isolate which techniques move a defined visibility metric, not a sample of real user behavior."),
         ("Does the paper's 2023 data still apply to ChatGPT, Gemini and Perplexity in 2026?",
          "As a shape, reasonably well; as an exact set of numbers, treat it carefully. The paper predates 2026 by more than two years and its benchmark is synthetic, not live production traffic against today's retrieval systems. What has held up across later disclosed research covered elsewhere on this site is the general pattern, not necessarily the precise percentages."),
         ("Which of the nine techniques should I actually use today?",
          "The five the paper found produced a real, measured gain: Statistics Addition, Quotation Addition, Cite Sources, Fluency Optimization and Authoritative Voice. None of them are guaranteed to reproduce the paper's exact lift on a 2026 production engine, but they are the five with actual evidence behind them rather than assumption."),
         ("Why do keyword stuffing and simplifying your writing still get recommended if this study found they don't work?",
          "Because a lot of GEO advice circulating in 2026 was never checked against this paper, or any disclosed study, before being repeated. Keyword Stuffing and Easy-to-Understand simplification are two of the most common pieces of advice still in circulation, and this is the field's own founding study finding both did nothing or actively hurt.")],
    related=[("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
              "Where this paper sits alongside five other disclosed studies, in one comparison table rather than on its own."),
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "Three of this paper's five working techniques, turned into checklist items you can act on directly."),
             ("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
              "The reasoning behind acting on Statistics Addition and Cite Sources specifically, spelled out in full.")],
    cta_h="See where your own content already does this", cta_p="Run your domain through up to seven engines and read the answers back against this list. You'll see quickly whether your best pages already state a specific claim next to its source, or whether they don't.",
    body="""  <p>Two of this site's own articles, <a href="/bg-035.html">BG-035</a> and <a href="/bg-054.html">BG-054</a>, already mention that the field's founding academic paper tested nine content techniques, found five worked and four didn't, and name a few of the standout numbers along the way. That's the passing version. This is the full one: every one of the nine techniques individually, what it actually is, whether it helped or hurt, by roughly how much where the paper gives a number, and the study's real scale and method, because a citation this widely repeated deserves to be read once rather than summarized forever.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>The paper is Aggarwal, Murahari, Rajpurohit, Kalyan et al., <strong>"GEO: Generative Engine Optimization,"</strong> a collaboration across Princeton, Georgia Tech, the Allen Institute for AI, and IIT Delhi. Posted to arXiv 16 November 2023 and published at KDD 2024, it has been downloaded more than 9,106 times and cited 76 or more times as of March 2026, per the paper's own tracked figures. This piece reads the paper's own nine-technique breakdown directly rather than through this site's earlier passing mentions, dated 14 August 2026 for this pass.</p>
  </div>

  <h2>The benchmark: GEO-bench, not live production traffic</h2>

  <p>Before the techniques themselves, the scale and method matter, because they set the honest boundary on how far the findings travel. The paper built its own benchmark, <strong>GEO-bench</strong>, a synthetic query set paired with a black-box optimization method, rather than pulling from real search logs or live production AI answers. It scored each technique against two defined metrics: <strong>Position-Adjusted Word Count</strong>, a measure of how much of a source's content the model's answer actually draws on and where, and <strong>Subjective Impression</strong>, a measure of how favorably a source is treated in the generated answer. Both are the paper's own instruments, built to isolate which techniques move a citable-content score under controlled conditions, not to reproduce how ChatGPT or Gemini behave for a real user on a real day.</p>

  <h2>The five techniques that produced a real gain</h2>

  <p><strong>Statistics Addition.</strong> Adding concrete, quantifiable data points, numbers and figures, to support a claim rather than stating it in general terms. This produced the largest single lift the paper recorded, cited at up to <strong>41%</strong>.</p>

  <p><strong>Quotation Addition.</strong> Including direct quotations from relevant, credible sources rather than paraphrasing them. This reached around <strong>43%</strong> on one of the paper's two metrics, the strongest single figure recorded for any technique on that particular measure.</p>

  <p><strong>Cite Sources.</strong> Adding explicit citations and references to back specific statements, rather than leaving claims unattributed. This landed around <strong>28 to 30%</strong> overall, and produced a standout result on its own: a <strong>115% visibility jump</strong> for a page that started the benchmark ranked fifth. That detail matters more than the headline percentage. It means the technique helped a weaker-performing page close ground more than it helped a page that was already doing well, which is a different and more useful finding than a flat average.</p>

  <p><strong>Fluency Optimization.</strong> Rewriting content for grammatical correctness and smoother, more coherent flow, distinct from simplifying the vocabulary or reading level. This added roughly <strong>29%</strong>.</p>

  <p><strong>Authoritative Voice.</strong> Rewriting content in a more confident, expert register rather than a tentative or hedged one. The paper reports this produced a real, measurable gain; the material available for this piece does not carry a specific percentage for this technique the way it does for the other four, so it is reported here as a confirmed positive result without an attached number rather than an invented one.</p>

  <h2>The four that did nothing or actively hurt</h2>

  <p><strong>Keyword Stuffing.</strong> Repeating target keywords unnaturally throughout the content, the oldest trick in search optimization. Produced no gain or actively hurt performance in the paper's testing.</p>

  <p><strong>Easy-to-Understand simplification.</strong> Lowering the vocabulary and reading level of the content, on the assumption that simpler text is easier for a retrieval system to use. Same result: no gain, or a negative one.</p>

  <p><strong>Content Padding.</strong> Adding length through filler or loosely related material rather than substantive new information. No gain, or hurt.</p>

  <p><strong>Pure Persuasive Language.</strong> Leaning on marketing or rhetorical language, persuasive framing without new supporting substance. No gain, or hurt.</p>

  <p>The paper does not attach individual percentages to these four the way it does to the strongest of the five that worked, which is itself a finding worth sitting with: the techniques that failed, failed clearly enough that the paper's own framing groups them together as a set rather than ranking their individual damage.</p>

  <h2>Why 2023 data needs a 2026 caveat, stated plainly</h2>

  <p>This paper is the closest thing the GEO category has to a peer-reviewed foundation, and it is also, by the time you're reading this, more than two and a half years old, tested against a synthetic benchmark rather than today's production ChatGPT, Gemini, or Perplexity. Retrieval mechanics on all three of those systems have changed materially since November 2023. Cite this paper as the study that established the shape of the field, five techniques with real evidence, four with none, not as current-state proof of exactly how much any one technique moves a 2026 citation rate. <a href="/bg-035.html">BG-035</a> makes the same point about the paper alongside five newer, disclosed studies that measure closer to production conditions; read that piece if the question is what's true right now rather than what founded the argument.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Nine techniques, tested once, on a synthetic benchmark, more than two years ago. Five held up under that test: adding real statistics, adding real quotations, citing sources next to the claims they support, writing more fluently, and writing with more authority. Four did not: stuffing keywords, oversimplifying, padding length, and leaning on persuasion instead of substance. That is a real, if dated, finding. Treat the shape of it as durable and the exact percentages as a snapshot of one study's one benchmark.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-083
ARTICLES.append(dict(
    slug="bg-083", bid="BG-083", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["AI Shopping", "Ecommerce", "How To"],
    title="What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It",
    h1="What to Fix on a Product Page <em>Before an AI Shopping Agent</em> Can Recommend It",
    h1_plain="What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It",
    subtitle="Clear price and availability data, an unambiguous product identifier, machine-readable specs, and nothing critical trapped in an image or a script an agent might never run. The tactical follow-on to why this is a separate visibility problem in the first place.",
    meta_desc="Concrete fixes for a product page so an AI shopping agent can parse and recommend it: structured price and availability data, real product identifiers, machine-readable specs, no critical info in images or unexecuted JS.",
    og_desc="An AI shopping agent doesn't read your product page the way a shopper does. It needs the price, the availability, and the identifier in a form it can parse without guessing. Here is what that actually requires.",
    ld_desc="A tactical checklist for preparing ecommerce product pages for AI shopping agents, covering structured price and availability data, product identifiers, machine-readable specifications, and rendering pitfalls.",
    keywords="ai shopping agent product page optimization, prepare ecommerce site for ai agents, structured data for ai shopping agents, agentic commerce product page checklist, Universal Commerce Protocol product data",
    about=["AI Shopping", "Ecommerce Strategy", "Structured Data", "Agentic Commerce"],
    findings=[("Jan 2026", "when the Universal Commerce Protocol, co-developed by Google and Shopify, was announced"),
              ("Jan 8, 2026", "when Copilot Checkout launched in the US across Copilot, Bing, MSN and Edge"),
              ("0", "credit an agent gives a price, spec, or availability status it can only find inside an image or a script it never executes"),
              ("2", "separate infrastructure layers a product now has to clear: discovery and checkout")],
    faq=[("Is this the same problem as BG-049's coverage of Daydream and AI shopping agents?",
          "It's the tactical follow-on to it. BG-049 explains why being cited well in a conversational engine like ChatGPT and being surfaced by a shopping-specific agent are two different problems with two different mechanisms. This piece assumes that framing and answers a narrower question: once a brand has a partnership or feed relationship with a discovery or checkout layer, what specifically has to be true on the product page itself for an agent to parse and recommend it."),
         ("Does adding schema markup guarantee an AI shopping agent will recommend my product?",
          "No, and this piece doesn't claim that. Ahrefs' matched-control study, covered in BG-038 and BG-052, found adding JSON-LD schema produced no statistically significant citation increase in conversational AI answers. That finding is about chat citation, a different mechanism. For a shopping agent specifically, structured data is closer to a parsing requirement than a ranking signal: the agent needs a machine-readable price and availability status to act on at all, independent of whether structured markup increases the odds of being chosen."),
         ("What is the Universal Commerce Protocol and why does it matter here?",
          "An open standard co-developed by Google and Shopify, announced January 2026, letting an AI agent complete checkout on a merchant's behalf without a person navigating the site. It matters to product-page readiness because a checkout-layer standard like this assumes the agent already has clean, structured data about what it's buying; a page that only communicates price or availability through prose or an image gives the agent nothing reliable to act on at the checkout step, even once discovery has already happened."),
         ("What's the single most common failure on a product page for this?",
          "Price, availability, or a key spec that only exists inside an image, a PDF, or a piece of client-side JavaScript that renders after the initial page load. An agent that doesn't execute that script or read that image sees a page with no usable answer to the exact question it needs answered.")],
    related=[("/bg-049.html", "BG-049", "AI Shopping Agents Are a Different Visibility Problem Than Chat Answers",
              "The problem this piece addresses tactically: why discovery-layer visibility and chat-answer visibility are not the same achievement."),
             _R_043,
             _R_039],
    cta_h="Check whether your own site says this clearly", cta_p="Run your domain through our free test to see how AI engines currently describe your product and pricing. It won't test agentic checkout directly, but a page an agent can parse is the same page a chat engine can cite correctly.",
    body="""  <p><a href="/bg-049.html">BG-049</a> makes the case that being well cited in a ChatGPT answer and being recommended by an AI shopping agent are two separate achievements, with two separate sets of mechanics behind them. That piece stops at naming the problem. This one is the tactical follow-on: assuming a brand already has, or is pursuing, a relationship with a discovery layer like Daydream or a checkout layer like the Universal Commerce Protocol, what specifically needs to be true on the product page itself before an agent can parse it and act on it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>14 August 2026</strong>. The Universal Commerce Protocol's announcement date, backers, and mechanics, and Copilot Checkout's launch date and partners, are drawn from Google's own commerce blog and independent press coverage, both already cited in this site's earlier reporting. The specific page-level recommendations below follow directly from what a checkout-capable agent needs to function, rather than from a disclosed study measuring their effect on agent recommendation rates; that distinction is stated plainly rather than implied.</p>
  </div>

  <h2>Structured price and availability data, not prose</h2>

  <p>An agent completing a purchase, whether through the Universal Commerce Protocol Google and Shopify co-developed or through Copilot Checkout, which launched in the US on 8 January 2026 across Copilot, Bing, MSN and Edge, needs a price and a stock status it can read programmatically, not a sentence it has to interpret. That means schema.org <code>Offer</code> and <code>Product</code> properties (<code>price</code>, <code>priceCurrency</code>, <code>availability</code>) filled in accurately and kept current, not "call for pricing" or a price that only appears after a size or color is manually selected through an interaction the agent may not perform. This is a different claim from "schema gets you cited by ChatGPT," which the matched-control research covered in <a href="/bg-052.html">BG-052</a> found does not hold. Here the job is narrower and more mechanical: give the agent something to parse at all, independent of whether it increases the odds of being chosen.</p>

  <h2>Unambiguous product identifiers</h2>

  <p>A GTIN, UPC, MPN, or SKU that maps cleanly to the exact variant being described removes a category of failure that is easy to overlook: an agent choosing the wrong size, color, or bundle because the page didn't distinguish it clearly enough in machine-readable form. A human shopper resolves that ambiguity by looking at a photo and reading context. An agent acting on structured data has no equivalent fallback unless the identifier itself is unambiguous.</p>

  <h2>Machine-readable specs, not just marketing copy</h2>

  <p>A paragraph describing a product's material, dimensions, or compatibility in persuasive prose is written for a person. An agent comparing several products against a buyer's stated requirement benefits from the same facts expressed as structured attributes, dimensions as explicit values with units, materials as a defined field, compatibility as a discrete list rather than a sentence buried in a longer description. Where the two coexist, that's not redundant. It's the same information doing two different jobs for two different readers.</p>

  <h2>Nothing critical trapped in an image or an unexecuted script</h2>

  <p>This is the most common failure and the easiest to miss, because it's invisible to a person browsing the page normally. Price, availability, or a decisive spec that only renders inside a product image, a PDF spec sheet, or client-side JavaScript that fires after the initial page load may never reach an agent that doesn't execute that script or read that image the way a browser with a person behind it does. The safest assumption is that anything decision-critical should be present in the page's initial, server-rendered, machine-readable content, with the image or interactive element as a supplement for a human shopper rather than the only place the fact lives.</p>

  <h2>This is a different job than being cited in a chat answer</h2>

  <p>None of the above overlaps meaningfully with what earns a citation in a ChatGPT or Perplexity answer, which the disclosed research covered in <a href="/bg-035.html">BG-035</a> ties to third-party mentions and source freshness. A product page can be excellent by every GEO standard this site has published and still fail an agent at checkout if its price only exists as an image, or excellent by every standard here and still never be discovered at all if it has no partnership with a discovery layer like Daydream in the first place, per <a href="/bg-049.html">BG-049</a>. Discovery, chat citation, and agentic checkout readiness are three separate bars. This piece is about clearing the third one.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>No disclosed study measures how much these specific fixes move an AI shopping agent's recommendation rate; that evidence doesn't yet exist publicly for this piece to cite honestly. What's available instead is the plain mechanical requirement underneath both the Universal Commerce Protocol and Copilot Checkout: an agent needs to read a price, an availability status, and a clear identifier without guessing. A page that hides any of those in an image or a script an agent doesn't run has failed before the agent even gets to decide whether to recommend it.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-084
ARTICLES.append(dict(
    slug="bg-084", bid="BG-084", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Budget & ROI", "GEO Strategy", "B2B"],
    title="A Board-Ready Case for a GEO Budget When There Is No ROI Metric to Show",
    h1="A Board-Ready Case for a GEO Budget <em>When There Is No ROI Metric</em> to Show",
    h1_plain="A Board-Ready Case for a GEO Budget When There Is No ROI Metric to Show",
    subtitle="A companion piece elsewhere explains why AI citation cannot be pixel-tracked. This one skips that argument and gives the pitch mechanics: which budget category to compare against, which leading indicators to report instead of ROI, and a sample one-slide structure.",
    meta_desc="A framework for pitching a GEO budget without a hard ROI number: compare it to a budget category already approved on judgment, report leading indicators instead, and a sample one-slide ask structure.",
    og_desc="No pixel to track, no last-click number, and the budget still needs to be approved. Here is how to make the case using the same logic that already funds PR, brand marketing and event sponsorship.",
    ld_desc="A budgeting and pitch framework for securing investment in generative engine optimization in the absence of a direct ROI metric, using precedent budget categories and leading indicators.",
    keywords="geo budget pitch cfo, how to justify ai search visibility spend, GEO ROI alternative metrics, pitching AI visibility budget to leadership, share of voice AI search, GEO budget board presentation",
    about=["Generative Engine Optimization", "Budget & ROI", "B2B Marketing", "Leadership Communication"],
    findings=[("22 points", "how far the share of B2B software buyers starting research in a chatbot moved in about a year, per G2's 2026 report, covered in BG-051"),
              ("94%", "of CMOs who say they plan to increase AEO investment in 2026, per Conductor's own survey, a vendor-sponsored figure worth citing as such"),
              ("3", "leading indicators to report instead of a single ROI number: share of voice trend, citation rate trend, competitive gap"),
              ("1", "slide, the size of ask this framework is built to fit")],
    faq=[("What if the CFO demands a hard ROI number anyway?",
          "Say plainly that one doesn't exist yet for this category, the same way it doesn't for most PR and brand spend, and point to the same leading-indicator reporting those budgets already run on. Promising a fabricated ROI number to get the budget approved creates a worse conversation at the next review, when the number inevitably doesn't hold up."),
         ("Why compare GEO spend to PR or brand marketing instead of paid search?",
          "Because paid search has a direct, trackable ROI mechanism and GEO currently does not, which makes the comparison misleading in the wrong direction. PR, brand marketing and event sponsorship are budget categories a board already funds on judgment and leading indicators rather than a hard attribution chain, which is the more honest and more persuasive comparison for a category with the same measurement shape."),
         ("How often should these leading indicators be reported?",
          "On a fixed schedule, quarterly is a reasonable default, and always as a trend across multiple measurements rather than a single reading. A share of voice or citation rate figure from one measurement pass carries real run-to-run noise, covered in BG-037, so reporting one number as if it were stable invites exactly the credibility problem this framework is trying to avoid."),
         ("What if the trend goes the wrong direction?",
          "Report it anyway, on the same schedule, rather than skipping the review or reframing the number. A framework built on leading indicators only holds credibility if it reports the indicator honestly when it's unfavorable, not only when it supports the budget.")],
    related=[("/bg-051.html", "BG-051", "Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
              "The B2B buyer-shift figures this pitch's urgency section is built on."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "Why every leading indicator in this framework has to be reported as a trend, not a single score."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The tool-free method for generating the citation rate and competitive gap numbers this pitch reports on.")],
    cta_h="Get your first data point for the slide", cta_p="Run your domain through up to seven engines to see your current citation position before you write the pitch. It's the starting number the one-slide structure below asks you to report against, and it costs nothing to pull.",
    body="""  <p>A companion piece on this site lays out in full why AI citation cannot be pixel-tracked the way a paid ad or an email campaign can, no last-click attribution, no stable ranking to point at. This one skips that argument entirely and goes straight to what actually gets a budget approved without it: which comparison makes the ask make sense, which numbers to report instead of ROI, and how to fit the whole case onto one slide.</p>

  <div class="callout">
    <div class="callout-label">How this was built</div>
    <p>This is a framework and synthesis piece, not new research. The urgency case draws on <a href="/bg-051.html">BG-051's buyer-behavior figures</a>, the trend-not-snapshot logic on <a href="/bg-037.html">BG-037's coverage of SparkToro's consistency study</a>, and the leading-indicator sourcing on <a href="/bg-053.html">BG-053's self-audit method</a>. Conductor's CMO investment survey, cited below, is a named vendor report with a commercial interest in the category, flagged here as vendor-sponsored rather than independent. Dated 14 August 2026 for this pass.</p>
  </div>

  <h2>Anchor the ask to a budget category the board already approves without hard ROI</h2>

  <p>GEO spend gets compared to paid search or performance marketing more often than it should be, and that comparison sets it up to lose, because paid search has a direct attribution chain and GEO currently does not. The more honest comparison, and the more persuasive one, is against a budget category the board already funds without a pixel: PR, brand marketing, event sponsorship. Those categories are approved on judgment plus leading indicators, share of voice, sentiment, earned coverage volume, not a last-click number, and they have been for years. Framing GEO spend the same way isn't a workaround, it's an accurate description of what kind of investment this actually is.</p>

  <h2>Three leading indicators to report instead of ROI</h2>

  <p><strong>Share of voice trend.</strong> How often your brand appears across a fixed set of category prompts relative to named competitors, tracked over successive measurement passes rather than as one reading.</p>

  <p><strong>Citation rate trend.</strong> Whether your brand is cited with a real source, not just named, across the same prompt set, over time. A single measurement of this carries real noise, per <a href="/bg-037.html">BG-037's coverage of SparkToro's consistency finding</a>, so this indicator only means something reported as a trend across multiple runs, never as one number in isolation.</p>

  <p><strong>Competitive gap.</strong> Who shows up instead of you, and whether that gap is narrowing or widening across successive checks, the same comparison a manual spot check or an ongoing tool can both produce, sourced consistently pass to pass.</p>

  <p>None of these three is a revenue number, and the pitch should say so directly rather than imply otherwise. They are the same category of metric PR and brand teams have reported to boards for years, applied to a newer channel.</p>

  <h2>Why the urgency case still works without an ROI number</h2>

  <p>G2's 2026 AI Search Insight Report found 51% of B2B software buyers now start their research inside an AI chatbot instead of a search engine, up from 29% in April 2025, a 22 point move in about a year, covered in full in <a href="/bg-051.html">BG-051</a>. Conductor's own 2026 survey, a vendor-sponsored report and worth citing as such rather than as independent fact, found 94% of CMOs plan to increase AEO investment this year. Neither figure proves a specific return. Together they establish that the audience a B2B budget exists to reach has already moved, which is a different and arguably stronger case than an ROI projection nobody in this category can currently back with a causal study.</p>

  <h2>The one-slide structure</h2>

  <ul>
    <li><strong>The shift, one stat.</strong> The G2 figure above, or your own category's closest equivalent, stated plainly with its source named.</li>
    <li><strong>What we'll track.</strong> The three leading indicators, defined in one line each, with a stated measurement cadence.</li>
    <li><strong>The ask, sized against precedent.</strong> The requested budget, framed as a fraction of an existing PR or brand-marketing line rather than as a new category with no comparison point.</li>
    <li><strong>The review commitment.</strong> A fixed date, typically the next quarterly review, where the three indicators get reported back, favorable or not.</li>
  </ul>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>No disclosed study proves that GEO spend causes a citation gain, and this framework doesn't claim one does. What it offers instead is a comparison that already has board-level precedent, a set of indicators honest enough to report even when they're unfavorable, and a structure small enough to actually get read. That's a different kind of case than an ROI number, and in this category right now, it's the honest one available.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-085
ARTICLES.append(dict(
    slug="bg-085", bid="BG-085", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["How To", "Local Search", "Google AI Overviews"],
    title="How to Prepare Your Google Business Profile for AI Overviews, Not Just Maps",
    h1="How to Prepare Your Google Business Profile for <em>AI Overviews</em>, Not Just Maps",
    h1_plain="How to Prepare Your Google Business Profile for AI Overviews, Not Just Maps",
    subtitle="Most Google Business Profile advice was written to move a Maps pin. AI Overviews and AI Mode read that same profile differently, and Google has never published exactly how much weight it carries.",
    meta_desc="Practical guidance for preparing a Google Business Profile for AI Overviews and AI Mode, not just Maps ranking: categories, description, reviews, and hours, with what's unverified stated plainly.",
    og_desc="Category accuracy, a factual description, review responses, and current hours. None of it is a proven AI Overviews formula, because Google has never published one. Here's what's reasonable to do anyway.",
    ld_desc="A practical guide to preparing a Google Business Profile for how Google's AI Overviews and AI Mode read business listings, distinct from traditional Maps and local pack optimization.",
    keywords="google business profile ai overviews, gbp optimization for ai search, google business profile ai mode, local seo for ai search, ai overviews local business, gbp for generative engine optimization",
    about=["Local Search", "Google AI Overviews", "Google Business Profile", "Generative Engine Optimization"],
    findings=[("42%", "share of Yext's disclosed 6.8-million-citation study that traced to business listings, a category that includes but is not limited to Google Business Profile"),
              ("5", "structural changes Google made to AI Overviews and AI Mode in its May 2026 update, disclosed by Google, including a new block pulling first-hand perspectives from reviews and forums"),
              ("Undisclosed", "the exact weight a Google Business Profile carries inside an AI Overview or AI Mode answer; no public Google formula exists for this"),
              ("1B+", "monthly AI Mode users as of Google I/O, May 19 2026, disclosed by Google")],
    faq=[("Does optimizing my Google Business Profile actually help my AI Overviews visibility?",
          "It's a reasonable bet, not a proven formula. Google has never disclosed how much weight a Business Profile carries in an AI Overview or AI Mode answer specifically, as opposed to a traditional Maps or local pack result. What is disclosed is that Yext's 6.8-million-citation study found business listings account for 42% of the citations it tracked, on par with brand websites. That's evidence the category of content matters, not proof of exactly how a Business Profile is weighted."),
         ("Should I write a longer, more persuasive Google Business Profile description?",
          "No. Keep it factual and current instead. An AI system summarizing or answering about your business has less reason to repeat marketing language verbatim than it does a specific, checkable fact like a service area, a certification, or a founding year. Persuasive copy is written for a human reading a profile directly, not for a system extracting facts to answer someone else's question."),
         ("Do review responses actually get read by AI Overviews?",
          "Not confirmed for Google Business Profile specifically, but worth doing regardless. Google's May 2026 AI Overviews update added an Expert Advice block that pulls first-hand perspectives from forums, social media, and review sites into the answer. Whether that block draws on Google Business Profile reviews specifically, or only third-party review platforms, isn't stated in Google's own description of the change. Review text is parseable content either way, and a thoughtful response is one more factual data point about your business sitting in a place AI systems already index."),
         ("What's the single most concrete thing to fix first?",
          "Wrong hours and stale attributes. An AI answer that confidently tells someone you're open when you're closed is a worse outcome than not appearing at all, because it costs the business a wasted trip and costs the AI system's answer its own credibility. Categories and hours are also the parts of a profile Google states plainly it uses, unlike the parts specific to generative answers, which remain undisclosed.")],
    related=[("/bg-043.html", "BG-043", "What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
              "The five structural changes behind this piece's Expert Advice reference, read in full."),
             ("/bg-046.html", "BG-046", "The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing Three Times Out of Ten",
              "Why a wrong fact attached to a real-looking source is a worse outcome than no mention at all, the same logic behind fixing stale hours first."),
             ("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
              "The broader content playbook this profile-level guidance sits underneath.")],
    cta_h="See what an AI engine says about your business right now",
    cta_p="Run your business through the same engines this guide is written for. You get the answer on screen, in about a minute, before you touch a single field on your profile.",
    body="""  <p>Most Google Business Profile advice on the internet was written for one job: moving a pin up in Google Maps or the local three-pack. That job has a documented ranking logic behind it, relevance, distance, and prominence, and years of SEO testing to back it up. AI Overviews and AI Mode are a different surface, reading and summarizing across sources including business listings, and Google has never published a comparable formula for how a Business Profile factors into a generated answer. This is what's reasonable to do anyway, and what genuinely isn't confirmed.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a practical synthesis, not a new study. The May 2026 AI Overviews structural changes are drawn directly from Google's own disclosed rollout, covered in full in <a href="/bg-043.html">BG-043</a>. The business-listings citation share comes from Yext's disclosed 6.8-million-citation study. Where no disclosed Google mechanic exists, that gap is stated directly rather than filled in with a confident-sounding rule.</p>
  </div>

  <h2>Why Maps advice doesn't automatically transfer</h2>

  <p>Traditional local SEO optimizes for a ranked list: three pins, in an order, competing on the same documented signals. An AI Overview or AI Mode answer isn't a ranked list of businesses, it's a generated paragraph that may or may not mention your business by name, may or may not cite your profile as a source, and is assembled from whatever mix of sources the system decided to pull from for that specific question. A profile that's technically well-optimized for Maps ranking can still be invisible in a generated answer, and the reverse is also true. Treat the two as related but separate problems.</p>

  <h2>What's worth doing, stated plainly as reasonable practice</h2>

  <ul>
    <li><strong>Keep categories accurate and specific.</strong> A vague or overly broad primary category gives an AI system less to match your business against when someone asks a specific question. This is one of the few Business Profile fields Google explicitly documents as used in matching, even outside the generative-answer question.</li>
    <li><strong>Keep the description factual, not persuasive.</strong> Specific, checkable facts, such as a service area, a certification, or years in operation, are more useful to a system extracting facts than adjectives an AI has no particular reason to repeat verbatim.</li>
    <li><strong>Respond to reviews.</strong> Review text is itself parseable content sitting in a place Google already indexes. Google's own description of its May 2026 update names a new block pulling first-hand perspectives from reviews and forums into generated answers; whether that draws specifically on Google Business Profile reviews isn't stated, but the mechanism it describes makes review text worth treating as real content, not an afterthought.</li>
    <li><strong>Keep hours and attributes current.</strong> An AI answer that states your business is open when it isn't is a worse outcome for both the searcher and your reputation than no mention at all.</li>
  </ul>

  <h2>What's genuinely not verified</h2>

  <p>Exactly how much weight a Google Business Profile carries inside an AI Overview or AI Mode answer, relative to your website, third-party review sites, or other listings, is not a disclosed Google mechanic. Nothing in this piece should be read as a proven ranking formula. It's a set of reasonable, low-cost practices built on what Google has stated publicly about how these surfaces work in general, applied to the one part of a business's public presence built specifically to be machine-readable.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A Google Business Profile is one of the few pieces of a brand's presence built to be read by a machine in the first place. Keeping it accurate costs almost nothing and has no plausible downside, even without a disclosed formula proving exactly how much it moves an AI Overview.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-086
ARTICLES.append(dict(
    slug="bg-086", bid="BG-086", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["PR", "AI Citation", "Original Research"],
    title="How PR and Earned Media Actually Move the Citation Needle",
    h1="How PR and Earned Media Actually <em>Move the Citation Needle</em>",
    h1_plain="How PR and Earned Media Actually Move the Citation Needle",
    subtitle="The mechanism behind a stat this site has already published: why a journalist writing about your brand is structurally different, to an AI retrieval system, from your own marketing copy saying the same thing.",
    meta_desc="Why PR and earned media coverage correlate so strongly with AI citation, the mechanism behind it, and practical guidance for comms teams, built on disclosed studies already published on this site.",
    og_desc="Earned media accounts for 84% of AI citations, per Muck Rack's disclosed study. Here's the actual mechanism behind that number, and what it means for what a PR team should chase.",
    ld_desc="An explanation of the mechanism connecting earned media and PR coverage to AI engine citation, with practical guidance for communications teams, built on disclosed-methodology research.",
    keywords="pr earned media ai citations, does pr help ai search visibility, earned media generative engine optimization, ai citation pr strategy, does press coverage help chatgpt visibility",
    about=["Public Relations", "AI Citation Research", "Generative Engine Optimization", "Content Strategy"],
    findings=[("84%", "of all AI citations trace to earned media rather than a brand's own website, per Muck Rack's disclosed 25-million-link study"),
              ("99.99%", "of the 49,391 citations Search Engine Journal and Victorious logged across 175 brands pointed to third-party domains, not the brand's own site"),
              ("25-27%", "of all AI citations trace to journalism specifically, a subset of earned media, per Muck Rack, stable across three editions"),
              ("0.3%", "citation share for paid or advertorial content, per Muck Rack, functionally never cited")],
    faq=[("Does PR actually help a brand's AI search visibility?",
          "The correlational evidence is unusually strong for this category. Muck Rack's disclosed study of over 25 million links found 84% of all AI citations trace to earned media rather than a brand's own site, a figure stable across three editions since July 2025. Search Engine Journal and Victorious separately found 99.99% of citations they logged pointed to third-party domains. Neither study proves a single press hit causes a citation, but the pattern is consistent and large enough to be worth acting on."),
         ("Why does a journalist writing about my brand count differently than my own blog post saying the same thing?",
          "Because of what each one structurally is to a retrieval system, not just what it says. An independent publication writing about a brand creates a piece of content the brand doesn't control, hosted on a domain with its own reputation, that other sites can in turn reference and that search and AI systems have reason to treat as corroborating evidence. A brand's own marketing copy is a single, self-interested source with no independent confirmation attached. This is inference from the mechanism, not a disclosed AI-platform ranking factor, but it lines up with why paid and advertorial content is cited at close to zero rate while journalism specifically accounts for 25 to 27% of all citations, per the same Muck Rack data."),
         ("Does the type of coverage matter, or does any mention help equally?",
          "Reasonable inference says it isn't equal, though this is not a directly disclosed ranking factor. Coverage built around a specific, checkable fact, a number, a named study, a direct quote, gives a retrieval system something concrete to extract and attach to a claim. A generic 'best of' listicle mention gives it less to work with: a name in a list, with no fact attached to verify or cite. The field's founding academic study found that adding statistics and direct quotations to content produced the largest measured gains of any technique tested, which is consistent with, though not the same claim as, factual PR coverage mattering more than a passing brand mention."),
         ("What should a PR or comms team actually chase, given this?",
          "Coverage that states something specific and checkable about the brand, ideally with data attached, over coverage that only names the brand in a list. A data-journalism placement or a detailed feature is a stronger bet than a mass 'top 10 tools' roundup with a one-line mention, even though the roundup might feel like the bigger placement. Neither guarantees a citation. Both are structurally more useful to an AI system than the same claim made only on the brand's own site.")],
    related=[("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
              "Where the 84% earned-media figure comes from in full, alongside four other disclosed studies."),
             ("/bg-038.html", "BG-038", "Six AI Citation Claims the Industry Keeps Repeating, and What the Data Actually Shows",
              "Where a related, unresolved claim, whether backlinks matter the same way they do for Google, gets checked against the same disclosed research."),
             ("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
              "Item one on that playbook is earning third-party mentions before polishing your own site; this piece is the mechanism behind why.")],
    cta_h="Check whether your press coverage is showing up in AI answers",
    cta_p="Run your brand through the engines this research covers and see what's actually being cited right now, your own site, a review platform, or a piece of coverage you earned months ago.",
    body="""  <p>This site has already published the headline number: 84% of AI citations trace to earned media, not a brand's own website, per Muck Rack's disclosed 25-million-link study, covered in full in <a href="/bg-035.html">BG-035</a>. What that piece didn't spend much time on is the mechanism, why a journalist writing about a brand produces a structurally different result than the brand writing the same claim about itself. That mechanism is worth understanding directly, because it's what should shape what a PR or comms team actually chases, not just the top-line stat.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a synthesis piece built on disclosed studies already published on this site: Muck Rack's Generative Pulse (25M+ links, three editions since July 2025) and Search Engine Journal and Victorious's 175-brand, 49,391-citation study, both detailed in <a href="/bg-035.html">BG-035</a>. The mechanism described below, why independently published coverage functions differently from owned content to a retrieval system, is a reasoned inference consistent with those disclosed findings, not itself a separately tested or disclosed claim, and is labeled as such throughout.</p>
  </div>

  <h2>The mechanism: independence, not just mention</h2>

  <p>An AI system answering a question by retrieving and citing sources has a practical reason to prefer sources it can treat as independent of the entity being described. A brand's own website saying its product is the best is a single, self-interested claim with nothing corroborating it. A journalist at an independent publication reporting the same underlying fact, that the product does a specific thing, was reviewed a certain way, or achieved a measured result, creates a source with its own separate reputation, hosted on a domain the brand doesn't control, that other sites and systems can in turn reference. That structural difference, not the specific words used, is the most plausible explanation for why owned content is cited near zero and earned coverage dominates.</p>

  <h2>What kind of coverage seems to matter more</h2>

  <p>Nothing in the disclosed research separates coverage types by citation rate directly, so this section is inference from the mechanism above, not a measured finding. But the inference is a reasonable one: coverage built around a specific, checkable fact, a data point, a named study, a direct quote, gives a retrieval system something concrete to extract and attach a citation to. A brand's inclusion in a generic "best of" listicle, with no fact attached beyond the mention itself, gives the system less to work with. This lines up with a separate, directly disclosed finding: the academic paper that founded the GEO field found that adding statistics and direct quotations to content produced the largest measured gains of any technique it tested, up to 41% and 43% respectively. Data journalism and detailed features are a stronger structural bet than a mass mention, even though the mass mention can feel like the bigger placement in a press clipping report.</p>

  <h2>Practical guidance for a comms team</h2>

  <p>Pitch stories built around a specific number, finding, or comparison your brand can back up, not just a general "we exist and do good work" pitch. Prioritize placements where a fact or quote gets attributed directly to your brand over placements where your name sits in a list with nothing else attached. Track which of your earned placements get picked up or referenced elsewhere, since a citation being cited elsewhere is itself a further independence signal. None of this displaces owned content entirely, since a brand's own site still needs to exist and be accurate, but it argues for weighting a PR budget toward coverage quality over raw mention count.</p>

  <div class="callout teal">
    <div class="callout-label">The honest limit here</div>
    <p>The 84% figure is real and disclosed. The reasoning about which specific kind of coverage matters most is inference from that figure and from a separate, directly disclosed content study, not itself a tested ranking factor. Treat it as the best currently available direction, not a formula for exactly which pitch to write.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-087
ARTICLES.append(dict(
    slug="bg-087", bid="BG-087", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Checklist", "How To", "Technical GEO"],
    title="A Pre-Publish Checklist for Making a New Page Citable From Day One",
    h1="A Pre-Publish Checklist for Making a New Page <em>Citable From Day One</em>",
    h1_plain="A Pre-Publish Checklist for Making a New Page Citable From Day One",
    subtitle="Six things to check on one specific page, right before it goes live. Not a content strategy, not a broader playbook, just the last technical pass.",
    meta_desc="A six-item pre-publish checklist for making a single new page citable by AI engines from day one: specific claims, real statistics, crawlability, JSON-LD, internal links, and stable URLs.",
    og_desc="Before you hit publish on a new page: does it state a checkable claim, carry a real stat or quote, render without JS blocking a crawler, have valid JSON-LD, link from somewhere else, and sit at a stable URL?",
    ld_desc="A technical pre-publish checklist covering six items for preparing a single page to be discoverable and citable by AI engines, distinct from broader content strategy guidance.",
    keywords="how to make content ai citable, pre publish seo geo checklist, ai citable content checklist, new page checklist for ai search, page ready for chatgpt citation",
    about=["Technical SEO", "Generative Engine Optimization", "Content Strategy", "Checklist"],
    findings=[("6", "items on this checklist, checked once, on one page, right before it goes live"),
              ("41%", "the largest single citation lift found for adding real statistics to a page, per the field's founding academic study, correlational and drawn from a synthetic benchmark, not a live-production test"),
              ("43%", "the lift found for adding direct quotations on the same metric, same study"),
              ("0", "guarantee any single item on this checklist carries; each traces to disclosed research or basic crawlability mechanics, not a promise of citation")],
    faq=[("How is this different from BG-052 or BG-054?",
          "Scope. BG-052 is a playbook, reasoning through why each recommendation works. BG-054 is a broader content-strategy checklist covering earned media, freshness, and per-engine differences. This piece is narrower on purpose: six technical checks for one specific page, run once, right before publish, not an ongoing strategy."),
         ("Does a page need every item on this list to get cited?",
          "No single item is a guarantee, and none of the disclosed research behind these items claims otherwise. This is a floor, not a formula. A page missing several of these items can still get cited, and a page checking every box still might not. The point is removing avoidable, purely mechanical reasons a page never gets seen at all, not promising an outcome."),
         ("Why does it matter whether a page is linked from somewhere else on the site?",
          "An orphan page, one with no internal links pointing to it, is genuinely harder for a crawler to discover in the first place, independent of anything about the content's quality. This is basic crawlability, not a GEO-specific finding, but it's easy to miss on a page published outside a normal content workflow, such as a landing page built for a single campaign."),
         ("Why does URL stability matter for something as fast-moving as AI citation?",
          "Because a citation or a cached reference to a page is only useful if the URL keeps working. A page that gets citied once and then moves or redirects breaks whatever value that citation was building toward. Deciding on a final URL before publish, rather than after a page has already been shared or referenced, avoids that avoidable loss.")],
    related=[("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
              "The deeper reasoning behind why several of these six items matter, argued in full."),
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "The broader, ongoing content-strategy checklist this page-level list sits underneath."),
             ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
              "The source for the statistics and quotation lift figures cited in item two below.")],
    cta_h="Check whether your last published page is actually citable",
    cta_p="Run your domain through the same engines this checklist is built for and see what they currently say, and whether your newest pages are showing up at all.",
    body="""  <p>This is not a content strategy. <a href="/bg-052.html">BG-052</a> and <a href="/bg-054.html">BG-054</a> already cover that ground, with the reasoning and the sourced research behind each recommendation. This is narrower and more mechanical: six things to check on a single page, right before it goes live, that separate a page with a real chance of being read and cited from a page an AI system, or a search crawler, may never reasonably encounter at all.</p>

  <div class="callout">
    <div class="callout-label">How this was built</div>
    <p>This checklist combines two kinds of items. Items one and two trace to disclosed content research already covered on this site, specifically the field's founding academic study on content techniques, detailed in <a href="/bg-035.html">BG-035</a>. Items three through six are basic crawlability and discoverability mechanics, not GEO-specific findings, included because they're easy to overlook on a page published quickly or outside a normal workflow.</p>
  </div>

  <h2>The six items</h2>

  <ol>
    <li><strong>Does the page state a specific, checkable claim, not only vague language?</strong> "We help businesses grow" gives a retrieval system nothing to extract. "Our free audit checked 8 real AI engines" is checkable and specific. The former reads as filler; the latter reads as a fact.</li>
    <li><strong>Is there at least one real statistic or direct quotation on the page?</strong> The field's founding academic study found Statistics Addition and Quotation Addition were two of the strongest-performing content techniques it tested, up to 41% and 43% respectively on their measured metrics, correlational and drawn from a synthetic benchmark predating 2026, but consistent with the intuition that specific, sourced claims outperform generic prose. A page with neither is starting from a weaker position than one with both.</li>
    <li><strong>Is the page reachable without JS-only rendering blocking a crawler?</strong> If the core content only appears after client-side JavaScript executes, and the crawler fetching the page doesn't run that JavaScript, the page can be functionally empty from the crawler's point of view even though it looks complete in a browser. Check what the page returns on a plain, unrendered fetch, not just what you see when you load it yourself.</li>
    <li><strong>Is there valid Article JSON-LD on the page?</strong> Malformed schema doesn't just fail to help, it can silently drop the whole block, which means whatever structured signal it was meant to carry never reaches anything reading it. Validate it before publish, not after noticing something looks off weeks later.</li>
    <li><strong>Is the page linked from somewhere else on the site?</strong> An orphan page with no internal links pointing to it is harder to discover, independent of the content's quality. A new page should be linked from at least one existing page, a hub, a related-articles list, a nav entry, before or immediately at publish.</li>
    <li><strong>Is the URL stable, not likely to change or redirect soon?</strong> Decide on the final URL before publish. A citation or reference pointing at a URL that later moves loses whatever value it was building, and fixing it after the fact means chasing down every place that URL got shared or cited.</li>
  </ol>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>None of these six items guarantees a citation, and none should be sold as one. What they remove is the avoidable, purely mechanical reasons a page never gets a fair chance at all, missing before the content itself is ever judged. Check this list once, right before publish, and treat the deeper strategy questions as a separate, ongoing pass.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-088
ARTICLES.append(dict(
    slug="bg-088", bid="BG-088", date="2026-08-14", date_label="August 14, 2026", read=8,
    tags=["Competitive Landscape", "Buyer Guide", "Comparison"],
    title="Profound vs Peec vs Otterly: Which AI Visibility Tool Fits Your Budget",
    h1="Profound vs Peec vs Otterly. <em>Which AI Visibility Tool Fits Your Budget</em>",
    h1_plain="Profound vs Peec vs Otterly: Which AI Visibility Tool Fits Your Budget",
    subtitle="Three vendors, three different budgets and buyer types. A side-by-side roundup, plus links to the full one-on-one comparison for whichever one you're actually deciding between.",
    meta_desc="Profound vs Peec vs Otterly compared side by side: pricing, engine coverage, funding, and which buyer each one actually fits, sourced from public vendor pages as of August 2026.",
    og_desc="Profound is the funded enterprise pick. Peec is the fastest-growing mid-market challenger. Otterly is the cheapest true entry point. Here's the roundup, and links to the deep dive on each one.",
    ld_desc="A three-way roundup comparison of Profound, Peec AI, and Otterly.AI covering pricing, engine coverage, funding, and buyer fit, sourced from public vendor pricing pages and funding announcements.",
    keywords="profound vs peec vs otterly, best ai visibility tool 2026 comparison, geo tool comparison 2026, ai visibility monitoring vendors compared, profound alternative, peec ai alternative, otterly ai alternative",
    about=["Competitive Analysis", "AI Visibility Monitoring", "SaaS Buying Guide", "Generative Engine Optimization"],
    findings=[("$99", "Profound's published Starter monthly price, vendor-disclosed"),
              ("$95", "Peec AI's published Starter monthly price, vendor-disclosed"),
              ("$29", "Otterly.AI's published Lite monthly price, vendor-disclosed, before any engine add-ons"),
              ("$1B", "Profound's valuation at its reported February 2026 Series C, per funding announcements")],
    faq=[("Which of the three is cheapest to actually start with?",
          "Otterly.AI's Lite plan, published at $29/month for 15 prompts, is the lowest headline entry price of the three. It only ships with 4 core engines by default, ChatGPT, Google AI Overviews, Perplexity, and Copilot, with Gemini, Google AI Mode, and Claude priced as separate add-ons, which can push the real monthly cost well past the headline figure once those are added."),
         ("Which one covers the most AI engines out of the box?",
          "Profound claims 10 engines per its own vendor page, the broadest named count of the three, though that figure is a vendor claim rather than an independently audited count. Peec AI publishes 6 models included on every tier with no add-on gating. Otterly.AI includes 4 core engines by default and sells 3 more as paid add-ons."),
         ("Is Peec AI really the fastest-growing of the three?",
          "That's a reported claim, not a company-disclosed figure. Sifted reported Peec AI was raising a round targeting a $200 million valuation on the back of reported $10 million ARR roughly 16 months after founding, citing unnamed sources. Peec does publicly claim 3,000-plus teams as customers, including Zalando, Attio, and Wix. Treat the valuation and ARR figures as reported, not confirmed."),
         ("Should I just pick the one with the biggest funding round?",
          "Not necessarily. Funding size says more about a vendor's staying power and pace of feature development than about whether its specific engine coverage and pricing tier fit your budget today. Profound's scale fits an enterprise buyer with a wide brief; a smaller team is often better served checking whether Peec's or Otterly's narrower, cheaper tiers already cover what it actually needs.")],
    related=[("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
              "The full 13-vendor comparison this three-way roundup is drawn from, for anyone shopping beyond these three."),
             ("/bg-042.html", "BG-042", "The GEO Funding Boom, Mapped",
              "Where Profound's and Peec's funding rounds sit against the rest of the category's venture money."),
             ("/bg-089.html", "BG-089", "The Real Cost of Starting at Dollar X: What GEO Tools Charge Once You Add Credits",
              "Why the headline prices in the table below rarely match what a real account ends up paying.")],
    cta_h="See what a free check costs before comparing paid tiers",
    cta_p="Run your own brand through several AI engines at once, free, no signup, before you commit a budget line to any vendor on this page.",
    body="""  <p>Profound, Peec AI, and Otterly.AI come up in nearly every "best GEO tool" search, and they sit at genuinely different points in the market: a heavily funded enterprise leader, a fast-growing mid-market challenger, and the cheapest true self-serve entry point. This is the three of them side by side, in one place, distinct from the deeper one-on-one comparison this site already publishes for each.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Pricing and positioning below are drawn from each vendor's own public pricing page and funding announcements, checked in a research pass dated <strong>13 August 2026</strong>, the same pass behind this site's full <a href="/bg-036.html">13-vendor buyer's guide</a>. Where a figure is a third-party estimate or a reported claim rather than a vendor-disclosed number, that is stated directly in the table notes and the FAQ above. Pricing in this category changes often; check each vendor's own page before budgeting against any number here.</p>
  </div>

  <h2>Side by side</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>Profound</th><th>Peec AI</th><th>Otterly.AI</th></tr></thead>
    <tbody>
      <tr><td>Positioning</td><td>Enterprise default, widest claimed coverage</td><td>Mid-market challenger, fastest reported growth</td><td>Cheapest true self-serve entry point</td></tr>
      <tr><td>Engines</td><td>10 claimed by vendor</td><td>6 models, included on every tier</td><td>4 core included, 3 sold as add-ons</td></tr>
      <tr><td>Entry price</td><td>$99/mo Starter</td><td>$95/mo Starter</td><td>$29/mo Lite (15 prompts)</td></tr>
      <tr><td>Mid tier</td><td>$399/mo Growth, capped at 3 engines and 100 prompts</td><td>$245/mo Pro</td><td>$189/mo Standard (100 prompts)</td></tr>
      <tr><td>Funding / founded</td><td>$155M total, $1B valuation Feb 2026</td><td>$29.1M total, founded 2025</td><td>Bootstrapped, founded 2024</td></tr>
      <tr><td>Best for</td><td>Large teams wanting the broadest named coverage backed by a well-funded vendor</td><td>Mid-market marketing or SEO teams weighing coverage against price</td><td>Budget-conscious solo operators and agencies, unlimited seats on every plan</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Profound: the funded enterprise default</h2>

  <p>Profound is the only unicorn in the GEO category as of this pass, raising a reported $96 million Series C at a $1 billion valuation in February 2026. Its own pricing page lists a $99/month Starter tier and a $399/month Growth tier capped at 3 engines and 100 prompts, with Enterprise pricing reported by third-party reviews, not published by Profound, in the $2,000 to $5,000-plus a month range. Its differentiator is showing the literal AI answer text with a brand highlighted inside it, across the widest engine count any vendor in this comparison claims. For the deeper one-on-one breakdown, see <a href="/brandgeo-vs-profound.html">BrandGEO vs Profound</a>.</p>

  <h2>Peec AI: the fastest-reported growth</h2>

  <p>Peec AI, founded in Berlin in 2025, publishes 6 models included on every tier with no engine paywalling, starting at $95/month for its Starter tier and running to $495/month for Advanced, with a separate agency-tier ladder up to $795/month. It publicly claims more than 3,000 teams as customers, including Zalando, Attio, Squarespace, and Wix. Sifted reported the company was raising toward a $200 million valuation on reported $10 million ARR roughly 16 months after founding, citing unnamed sources, a figure this piece treats as reported rather than confirmed. For the full comparison, see <a href="/brandgeo-vs-peec.html">BrandGEO vs Peec AI</a>.</p>

  <h2>Otterly.AI: the cheapest real entry point</h2>

  <p>Otterly.AI is bootstrapped, founded in Austria in 2024, and publishes the lowest headline entry price of the three at $29/month for its Lite tier, with unlimited team seats on every plan, unusual in a category that typically meters by seat. The catch is engine coverage: only 4 core engines ship by default, and Gemini, Google AI Mode, and Claude are each separate paid add-ons that can push a real monthly bill well past the $189/month Standard tier's headline number once added. For the full breakdown, see <a href="/brandgeo-vs-otterly.html">BrandGEO vs Otterly.AI</a>.</p>

  <div class="callout teal">
    <div class="callout-label">Which one actually fits</div>
    <p>If budget isn't the constraint and you want the broadest named coverage from the best-funded vendor, Profound is the default pick. If you're a mid-market team weighing price against coverage, Peec's flat, no-paywall model is the more predictable bill. If you're testing whether AI visibility monitoring is worth budgeting for at all, Otterly's entry tier is the cheapest real way to find out, as long as you price in the add-ons before you commit.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-089
ARTICLES.append(dict(
    slug="bg-089", bid="BG-089", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Buyer Guide", "Pricing", "SaaS Buying Guide"],
    title="The Real Cost of Starting at Dollar X: What GEO Tools Charge Once You Add Credits",
    h1="The Real Cost of Starting at Dollar X. <em>What GEO Tools Charge Once You Add Credits</em>",
    h1_plain="The Real Cost of Starting at Dollar X: What GEO Tools Charge Once You Add Credits",
    subtitle="A headline price and a real monthly bill are often two different numbers in this category. Five questions to ask before you sign, not a list of numbers to memorize.",
    meta_desc="Why a GEO tool's advertised starting price rarely matches what a real account pays, the credit-based pricing pattern behind it, and five questions to ask a vendor before you buy.",
    og_desc="A $29 or $95 headline price is real. It's also rarely what a real account pays once engines, credits, and overage are added. Here's the pattern, and the questions that expose it before you sign.",
    ld_desc="An explainer on credit-based pricing patterns in AI visibility and generative engine optimization tools, with a structured set of buyer questions to surface the real monthly cost before purchase.",
    keywords="geo tool pricing hidden costs, ai visibility tool real cost, geo tool credit pricing explained, ai visibility monitoring hidden fees, how much does a geo tool actually cost",
    about=["SaaS Buying Guide", "Pricing", "AI Visibility Monitoring", "Generative Engine Optimization"],
    findings=[("4", "questions worth asking a vendor before you buy, beyond the headline price, that separate a real cost from a marketing price"),
              ("8x", "how much more some vendors charge to check Claude versus a base-rate engine check, observed across multiple credit-based pricing pages in an August 2026 pricing pass"),
              ("20-30%", "the overage rate commonly added once a usage-based plan's included allotment is exceeded, observed across several vendor pricing pages the same pass"),
              ("$1,000-5,000", "onboarding fees found on some enterprise contracts that never appear on the public pricing page at all, observed the same pass")],
    faq=[("Why do so many GEO tools advertise a low starting price?",
          "Because a low headline number is what gets a vendor into a comparison list and past the first click. It's usually a real price for a real, narrow tier, not a fabricated number. The gap between the headline and what a typical real account pays shows up afterward, once engines, prompt volume, or team seats exceed what that entry tier actually includes."),
         ("What's included in the base credit allotment, and what happens when I exceed it?",
          "Ask both questions separately, because the answers differ by vendor. Some plans hard-cap usage and simply stop returning results once the allotment is used. Others bill overage automatically, commonly at 20 to 30 percent above the base per-unit rate, observed across several vendor pricing pages checked in this site's August 2026 pricing pass. Get the specific mechanism in writing, not a general description, before you sign."),
         ("Does adding another AI engine always cost extra?",
          "Often, but not always, and it's worth checking per vendor rather than assuming. Some tools include a fixed engine set on every tier with no paywall. Others treat each additional engine as a separate line item, and engines aren't always priced equally: checking a higher-cost model like Claude can run several times the credit cost of checking a base-rate engine on some platforms, per the same pricing pass."),
         ("Is there a required annual commitment for the advertised price?",
          "Check this explicitly. A monthly headline price sometimes only applies with annual billing, with the true month-to-month price meaningfully higher. Some vendors also require an annual contract to unlock the lowest published tier at all. This is one of the easiest details to miss on a pricing page skimmed quickly, and one of the easiest to ask a sales rep directly.")],
    related=[("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
              "The full vendor-by-vendor pricing pass this piece's figures are drawn from."),
             ("/bg-088.html", "BG-088", "Profound vs Peec vs Otterly: Which AI Visibility Tool Fits Your Budget",
              "A concrete three-way example of headline prices that mean different things once engine coverage is factored in."),
             ("/bg-041.html", "BG-041", "How Many AI Engines Does a GEO Tool Actually Need to Cover?",
              "The question worth answering before you find out which engines cost extra.")],
    cta_h="Start with a real number: zero",
    cta_p="Test your brand across several AI engines free, no signup and no card, before you compare a single vendor's credit math against another's.",
    body="""  <p>"Starting at $X/month" is usually a true statement about a real, narrow tier. It's rarely a true statement about what a typical real account ends up paying once prompt credits, extra engines, extra domains, or team seats get added. This isn't a claim that any specific vendor is being deceptive, most publish their tier structure openly. It's a pattern worth understanding before you budget against a headline number, and a short list of questions that surfaces the real cost before you sign anything.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a general-pattern explainer, not a new vendor-by-vendor audit. The specific figures cited below, credit weighting, overage rates, and onboarding fees, are drawn from this site's own <a href="/bg-036.html">13-vendor pricing pass</a>, dated 13 August 2026, and are labeled here as observed across multiple vendor pricing pages in that pass rather than presented as a universal rule every vendor follows.</p>
  </div>

  <h2>Why a headline price and a real bill diverge</h2>

  <p>Credit-based pricing is common in this category, and it works the way most usage-based SaaS pricing does: a plan includes a fixed monthly allotment of checks or credits, and anything beyond that allotment either hard-caps your usage or bills as overage. The complication specific to GEO tools is that checks aren't always priced equally across engines. In the same pricing pass behind this site's buyer's guide, checking a higher-cost model like Claude was observed running as much as 8 times the credit cost of checking a base-rate engine on some platforms, while overage on usage-based plans commonly added another 20 to 30 percent to the bill once the base allotment ran out. Some enterprise contracts also carried separate onboarding fees of $1,000 to $5,000 that never appeared on the public pricing page at all.</p>

  <h2>A concrete, hedged example</h2>

  <p>Otterly.AI's own pricing page headlines its Standard plan at $189/month, and that figure is real. It ships with 4 core engines by default; Gemini, Google AI Mode, and Claude are each separate paid add-ons ranging from $9 to $439/month depending on tier. Add the three most commonly requested and a $189 plan can land closer to $300 or more before a single prompt or team seat has been changed. This is one documented example, not proof every vendor follows the identical pattern, covered in the roundup at <a href="/bg-088.html">BG-088</a> alongside two other vendors' pricing structures.</p>

  <h2>Four questions to ask before you buy</h2>

  <ul>
    <li><strong>What's included in the base credit allotment, specifically?</strong> Get the number of checks, prompts, or queries, not a vague "generous allowance."</li>
    <li><strong>What happens when you exceed it, a hard cap or overage billing?</strong> These are two very different financial exposures, and the answer isn't always on the pricing page.</li>
    <li><strong>Does adding another engine cost extra, and are all engines priced the same?</strong> Some platforms weight higher-cost models several times heavier than a base-rate check.</li>
    <li><strong>Is there a required annual commitment to unlock the advertised price?</strong> A monthly headline number sometimes only holds with an annual contract behind it.</li>
  </ul>

  <p>A fifth question worth adding for a competitive category: does tracking an additional competitor cost extra, or is it included in the base tier? Competitor tracking is a common upsell lever in this category and, like engine add-ons, isn't always disclosed clearly on the entry-tier pricing page.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A headline price tells you what a vendor wants to be compared on. These four questions tell you what you'll actually pay. Ask them before you sign, not after the first month's invoice shows engines and overage lines that never appeared on the pricing page you budgeted against.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-090
ARTICLES.append(dict(
    slug="bg-090", bid="BG-090", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Competitive Landscape", "Buyer Guide", "GEO Tools"],
    title="Six GEO Startups You Have Not Heard of Yet",
    h1="Six GEO Startups You Have <em>Not Heard Of</em> Yet",
    h1_plain="Six GEO Startups You Have Not Heard of Yet",
    subtitle="Profound, Peec AI, Otterly and the rest of the category's most-covered names get most of the comparison-page attention. These six do real, differently shaped work and rarely make anyone's shortlist.",
    meta_desc="Six lesser-known GEO and AI-visibility vendors, Waikay, Nightwatch, Evertune, Bluefish AI, BrightEdge and Search Atlas, sourced from a competitive-landscape research pass, August 2026.",
    og_desc="Not every AI-visibility vendor is Profound or Peec AI. Six smaller or differently positioned names, what each claims to do differently, and what is still undisclosed about them.",
    ld_desc="A survey of six lesser-known GEO and AI-visibility vendors distinct from the category's most-covered names, drawn from a competitive-landscape research pass, including what each discloses and what remains unverified.",
    keywords="geo startups 2026 emerging tools, lesser known ai visibility tools, small geo vendors, ai visibility startups 2026, emerging geo tools",
    about=["Competitive Landscape", "GEO Tools", "Buyer Guide", "Emerging Vendors"],
    findings=[("6", "vendors profiled here, none of them among the ten names that already have a dedicated comparison page on this site"),
              ("$19.95", "Waikay's monthly entry price, the cheapest named headline figure found anywhere in this research pass"),
              ("$68M", "raised by Bluefish AI in under two years, for a product whose own pricing page returns a 404"),
              ("3", "of the six that publish no standalone price for the AI-visibility feature covered here, either bundling it into an existing platform quote or gating it entirely behind a demo")],
    faq=[("Why isn't Rankscale or Goodie AI on this list?",
          "Because this site already runs a dedicated comparison page for each of them, alongside Profound, Peec AI, Otterly, Ahrefs Brand Radar, AthenaHQ, Conductor, Scrunch and Semrush. This piece is specifically about names that do not get that treatment."),
         ("Are any of these six actually built for AI visibility, or are some bolted onto something older?",
          "It splits down the middle. Waikay, Bluefish AI and Evertune were built for this category from the start. Nightwatch's core product predates it as a traditional SERP rank tracker with an AI module added later. BrightEdge and Search Atlas are legacy SEO platforms that extended existing infrastructure to also capture AI answers, rather than building fresh prompt infrastructure."),
         ("Which of these six is cheapest to try?",
          "Waikay, at $19.95 a month with a free trial, the lowest named headline price this research pass found in the category. Nightwatch is close behind at $32 a month with a 14-day trial."),
         ("Which of these six is hardest to actually buy?",
          "Bluefish AI. Its pricing page returns a 404, there is no free tier or trial, and every call to action on the site is a demo request. Independent estimates put its enterprise contracts at $100,000 to $500,000 or more a year.")],
    related=[("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
              "The full pricing table this piece pulls three of its six names from, laid out side by side."),
             ("/bg-040.html", "BG-040", "Is GEO Just SEO With a New Name? We Checked What 8 Legacy SEO Tools Actually Built",
              "The full legacy-tool audit behind BrightEdge and Search Atlas's entries here."),
             ("/bg-050.html", "BG-050", "Bootstrapped vs. Venture-Backed: Does the Funding Show Up in the Product?",
              "Whether the funding gap between names like Waikay and Bluefish AI shows up in pricing transparency. It mostly does not.")],
    cta_h="Check where you actually stand, on whichever engines matter",
    cta_p="Run your domain through a real audit before comparing vendor pitches. You get the answer on screen in about a minute, no signup and no card.",
    body="""  <p>Most "best GEO tool" content, including a fair amount of this site's own comparison-page catalogue, circles the same ten or so names: Profound, Peec AI, Otterly, Ahrefs Brand Radar, AthenaHQ, Conductor, Goodie AI, Rankscale, Scrunch and Semrush. That is a defensible list. They are the most funded, most reviewed, or most likely to surface in a plain search for the category. It also means a buyer scanning only the well-covered names misses a second tier doing genuinely different things, some smaller and newer, some legacy SEO platforms retrofitting an AI-answer layer onto infrastructure built for something else entirely.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Drawn from a competitive-landscape research pass dated 13 August 2026 across the GEO and AI-visibility tool category. Every company, funding figure and product claim below traces to a vendor page, funding announcement or independent review cited in that pass; nothing here is estimated or invented. Rankscale and Goodie AI, both turned up by the same pass, are excluded because this site already runs a dedicated comparison page for each.</p>
  </div>

  <h2>Waikay: the cheapest entry price, and a hallucination-detection pitch</h2>

  <p>Waikay is unfunded and bootstrapped, founded in the UK in 2025, with published pricing starting at $19.95 a month and a free trial, the lowest headline price this research pass found anywhere in the category. It names six AI models across 47 languages and more than 100 countries. Its stated differentiator is "Query Fan Out," which generates a full set of related prompts, varying intent, verb, framing and audience, from a single seed prompt, plus explicit hallucination detection. Whether either feature holds up against a longer, real prompt list is not something this pass verified independently; the description above is Waikay's own.</p>

  <h2>Nightwatch: watching the AI's search, not just its answer</h2>

  <p>Nightwatch started as a traditional multi-engine SERP rank tracker and added LLM tracking more recently. Its stated differentiator is unusual for the category: it also tracks the real-time web searches an AI model performs while generating an answer, not just the finished text, which in principle gives visibility into the pipeline, query, sources pulled, final answer, rather than only the endpoint. Entry pricing is $32 a month with a 14-day free trial. One independent review notes that user reviews specific to the AI module are still scarce, a fair signal that this piece of the product is newer and less battle-tested than Nightwatch's original rank tracker.</p>

  <h2>Evertune: prices by prompt volume, not by seat</h2>

  <p>Evertune, based in New York and founded by early members of The Trade Desk's team, raised $20 million from Felicis Ventures and Eniac Ventures. It names 9 engines and prices its published Pro tier at $800 a month for 100,000 prompts across up to 11 models. One independent review states an actual price floor closer to $3,000 a month on an annual contract with a $36,000 minimum, a figure that disagrees with Evertune's own site and was not independently confirmed here. It also runs a separate "Shopping Intelligence" product tracking brand visibility inside AI-generated product recommendations.</p>

  <h2>Bluefish AI: no price, no self-serve, Fortune 500 only by design</h2>

  <p>Bluefish AI raised roughly $68 million in under two years, most recently a $43 million Series B co-led by Threshold Ventures and NEA. It has no public pricing page at all, its /pricing URL returns a 404, and every call to action on the site is a demo request. Independent estimates put its enterprise contracts at $100,000 to $500,000 or more a year, and its confirmed customers, Adidas and Tishman Speyer, fit a Fortune-500-only motion. It also tracks AI shopping agents such as Amazon's Rufus, a broader surface than most named competitors in this category cover.</p>

  <h2>BrightEdge and Search Atlas: the AI layer bolted onto a bigger platform</h2>

  <p>Both are legacy SEO platforms, not GEO-native startups, and both illustrate a pattern this research pass found across eight legacy tools: an AI-visibility module extending an existing keyword or SERP infrastructure rather than a purpose-built prompt system. BrightEdge launched "AI Hyper Cube" in March 2026, its first capability tracking brand appearance across AI-driven search and agent interactions specifically, alongside a separate "AI Agent Insights" feature tracking how AI crawlers interact with a brand's own site. Search Atlas offers an "LLM Visibility" module covering ChatGPT, Gemini, Perplexity and SearchGPT, with full model coverage opening on its Pro tier, plus "OTTO," an agent that implements schema, meta tag and internal-link changes through a site pixel, pending manual approval per change. Neither company's standalone AI-feature price surfaced in this research pass; both are quoted as part of a larger platform.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>None of these six is a like-for-like substitute for the category's best-known names, and this is not a ranking. It is six data points on how differently "AI visibility" gets built: a $19.95 bootstrapped tool, a legacy rank tracker's new module, a prompt-volume enterprise product, and a Fortune-500-only vendor with no public price at all. Weigh any one of them against its own stated claims, not against a general reputation, before deciding it fits.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-091
ARTICLES.append(dict(
    slug="bg-091", bid="BG-091", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Agencies", "Buyer Guide", "Methodology Transparency"],
    title="How Agencies Are Reselling AI Visibility Monitoring to Their SEO Clients",
    h1="How Agencies Are <em>Reselling</em> AI Visibility Monitoring",
    h1_plain="How Agencies Are Reselling AI Visibility Monitoring to Their SEO Clients",
    subtitle="SEO and marketing agencies are adding AI-visibility monitoring as a service line for existing clients, some by reselling a vendor built for it, some by dressing up a manual check as a subscription. The two can look identical in a monthly PDF.",
    meta_desc="SEO agencies are packaging AI visibility monitoring as a new client service line. What separates a real per-engine, per-prompt method from a one-time check billed monthly, and what to ask before signing.",
    og_desc="A monthly PDF with numbers on it is not proof of ongoing monitoring. What an agency reselling AI visibility tracking actually needs to run, and the questions that tell you whether they're doing it.",
    ld_desc="An examination of the agency-as-reseller business motion emerging around AI visibility monitoring, distinguishing genuine per-engine, per-prompt tracking from manual one-time checks repackaged as a recurring service.",
    keywords="geo agency reseller white label, seo agency ai visibility service, ai visibility monitoring for agencies, agency geo service line, white label ai search monitoring",
    about=["Agencies", "GEO Tools", "Buyer Guide", "Methodology Transparency"],
    findings=[("$245", "the monthly price of Peec AI's entry-level Agency plan, one of a small number of GEO vendors publishing a pricing tier built specifically for managing multiple client brands"),
              ("$795", "Peec AI's top named Agency tier before its custom 'Comprehensive' pricing, which scales with how many client accounts an agency runs"),
              ("1-in-100", "the chance SparkToro measured that the same AI platform returns the same brand list twice for an identical question, the reason a single manual check cannot stand in for ongoing monitoring"),
              ("4", "questions a client can ask an agency offering this service to tell a real per-engine, per-prompt method from a one-off check dressed up as a subscription")],
    faq=[("Is it legitimate for an SEO agency to resell AI visibility monitoring?",
          "Yes, the same way agencies have long resold rank tracking, analytics dashboards, or other tools under a service wrapper. The legitimacy question is not whether reselling happens, it is whether what sits underneath the service is real ongoing monitoring or a single manual check repeated monthly and presented as if it were continuous."),
         ("What does 'white-labeling a GEO tool' actually mean here?",
          "Typically that an agency buys or resells access to an existing vendor's product, sometimes under an agency-specific pricing tier, and presents the resulting reports under its own branding. Several vendors in this category publish pricing tiers explicitly aimed at agencies managing multiple client accounts, Peec AI among them, which is one signal the reseller motion is real and vendors are building for it."),
         ("How can I tell if my agency is really monitoring, or just checking once a month by hand?",
          "Ask what specific prompts are being run, on which engines, how often, and whether you can see the raw answer text behind any summary number they report. An agency running real ongoing monitoring should be able to show a timestamped history across weeks, not a single snapshot dressed up as a trend."),
         ("Should I just buy a GEO tool directly instead of going through an agency?",
          "It depends on whether you need the strategic interpretation an agency is meant to add on top of the raw data, or just the raw data itself. A tool alone gives you numbers; an agency is supposed to add judgment about what to do with them. The problem this piece describes is not the markup, it is paying agency prices for a service that turns out to be neither the tool nor the judgment, just an occasional manual look.")],
    related=[("/bg-048.html", "BG-048", "Inside the GEO Tool Review-Site Economy",
              "A related trust problem one layer up the funnel: how to tell an independent vendor review from an affiliate funnel."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The same verification habit this piece asks a client to demand from an agency, written for doing it yourself."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "Why a single number from any source, agency-reported or not, needs a trend behind it to mean anything.")],
    cta_h="See what a real audit trail actually looks like",
    cta_p="Run your own domain through the same engines, on record, and compare it against whatever your agency has been reporting. No signup and no card.",
    body="""  <p>An AI-visibility line item is showing up on more SEO and marketing agency service sheets, usually next to rank tracking, content strategy and technical audits. That makes sense on paper: an agency already managing a client's search presence is a reasonable place to also manage how that client shows up in ChatGPT, Gemini and the rest. The trouble is that "AI visibility monitoring" can describe two very different things sitting inside an identical-looking invoice line, and a client has no easy way to tell which one they are paying for from the outside.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Drawn from a competitive-landscape research pass dated 13 August 2026 and this site's own recurring coverage of GEO vendor pricing. Peec AI's Agency-tier pricing is taken directly from its published pricing page. This piece does not name or evaluate any specific agency; it describes the business motion and the verification standard a client can reasonably hold an agency to.</p>
  </div>

  <h2>Why agencies are adding this now</h2>

  <p>The underlying pressure is straightforward: clients are asking whether they show up in AI answers the way they used to ask about a page-one Google ranking, and an agency that has no answer looks behind. Vendors have noticed the same shift. Peec AI, one of the category's more visible names, publishes a dedicated Agency track separate from its Brand pricing, running Essential at $245 a month up to Scale at $795 a month before a custom Comprehensive tier, priced to scale with how many client accounts an agency actually runs. That is direct evidence the reseller motion is real enough for at least one vendor to build a pricing structure around it, not just an assumption about where the market is headed.</p>

  <h2>Two different things called "reselling"</h2>

  <p>One version is a genuine reseller relationship: the agency licenses a real per-engine, per-prompt monitoring tool, either under its own agency tier or a white-labeled arrangement, and runs it on a schedule against a defined prompt list for each client, then adds its own strategic read on top of what the data shows. The other version is closer to a manual spot check performed once, occasionally repeated, and written up as though it were a continuously running product. Both can produce a monthly PDF with numbers that look similarly confident. The difference is entirely in whether there is a repeatable, scheduled method behind the numbers or a single person opening ChatGPT a few times before a deadline.</p>

  <h2>Why a one-time check cannot be the whole service</h2>

  <p>This is where the underlying measurement problem for the entire category matters directly. SparkToro's research, covering 600 volunteers and 2,961 individual queries across major AI platforms, found less than a 1-in-100 chance that the same AI platform, asked the same question twice, returns the same list of brand recommendations, and roughly a 1-in-1,000 chance the order matches. A single check, however carefully done, is a snapshot of a genuinely unstable system, not a stable reading a client can trust the way they might trust a Google rank check. Turning that single snapshot into a monthly deliverable without disclosing that it is a snapshot, not a trend, is where a manual-check service starts to misrepresent itself, whether or not that is the intent.</p>

  <h2>What to ask before you pay for this as a service</h2>

  <p>A client evaluating this offer, from an existing agency or a new one, has a short, concrete list worth asking through before signing anything. Which specific prompts are run, and were they chosen to reflect how real customers actually ask, not just brand-name searches. Which engines are actually queried, by name, and how does that map to where the client's own customers are asking. How often does the check run, and can the client see a dated history rather than a single most-recent number. And can the agency show the raw answer text an engine returned, not just a summarized percentage, so the client can verify the number themselves rather than take it on faith. An agency with a real method answers all four without hesitation. An agency dressing up a manual check as a subscription usually cannot.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Reselling AI visibility monitoring is a reasonable service line, and at least one vendor's own agency pricing tier shows the demand is real. What makes it credible is the same thing that makes any monitoring credible: a defined method, run on a schedule, with an audit trail the client can check. A monthly PDF with numbers on it proves nothing on its own.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-092
ARTICLES.append(dict(
    slug="bg-092", bid="BG-092", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Enterprise", "Buyer Guide", "Competitive Landscape"],
    title="What a Six-Figure Enterprise GEO Contract Actually Includes",
    h1="What a Six-Figure <em>Enterprise GEO Contract</em> Actually Includes",
    h1_plain="What a Six-Figure Enterprise GEO Contract Actually Includes",
    subtitle="At the high end, GEO engagements can run into six figures a year. What that premium buys over a self-serve subscription, drawn from what enterprise-tier vendors in this category actually disclose, and when a smaller company does not need it.",
    meta_desc="What separates a six-figure enterprise GEO contract from a self-serve SaaS subscription: consulting hours, custom prompt sets, cross-team reporting, and remediation, sourced from vendor pricing pages and reviews.",
    og_desc="Bluefish AI and Evertune sell enterprise-only, demo-gated GEO contracts that independent reviews put well into six figures a year. Here is what that premium is documented to actually include.",
    ld_desc="An examination of what differentiates enterprise-tier GEO and AI-visibility engagements from self-serve subscriptions, drawn from vendor pricing pages and independent reviews, including when a smaller company does not need this tier.",
    keywords="enterprise geo contract pricing, managed ai visibility service cost, enterprise ai visibility platform, geo consulting contract, six figure ai monitoring contract",
    about=["Enterprise", "GEO Tools", "Buyer Guide", "Competitive Landscape"],
    findings=[("$100,000 to $500,000+", "the estimated annual range independent reviews put on Bluefish AI's Fortune-500-only enterprise contracts; the vendor publishes no price at all"),
              ("$36,000", "the annual contract minimum one independent review reported for Evertune, against the roughly $9,600-a-year figure implied by its own published $800-a-month Pro tier"),
              ("$2,000 to $5,000+", "a month third-party reviews estimate for Profound's Enterprise tier, which removes the engine and prompt caps carried by its published $99 and $399 plans"),
              ("0", "of the three vendors examined here that publish a flat enterprise price on their own site; all three route that buyer to a sales conversation instead")],
    faq=[("What actually makes a contract 'enterprise' instead of just a bigger self-serve plan?",
          "In this category it typically means dedicated strategy or consulting hours rather than a self-serve dashboard alone, custom prompt sets built around the client's actual buyer journeys instead of a generic template, reporting shared across teams like SEO, PR and product rather than siloed to one function, and often a done-for-you remediation motion where the vendor's team acts on findings rather than only surfacing them."),
         ("Does a six-figure GEO contract mean more accurate underlying data than a $300-a-month plan?",
          "Not necessarily. The measurement problem underneath the entire category, that the same AI engine asked the same question twice rarely returns the same answer, applies regardless of price tier. What changes at the enterprise level is scope, service and integration around that data, not the statistical reliability of any single reading."),
         ("When does a company not need this tier?",
          "If a company has one brand, one core market, and a marketing team able to act on a dashboard directly, self-serve tiers priced from roughly $99 to $800 a month in this category already query the same engines an enterprise contract does. The enterprise premium buys people and process on top of that data, not access to different underlying measurement."),
         ("Which vendors in this category sell at the six-figure tier?",
          "Bluefish AI and Evertune are both explicitly enterprise-focused with limited or no self-serve path and no published enterprise price. Profound offers a self-serve entry tier but its Enterprise pricing surfaces only through third-party reviews, in the $2,000 to $5,000-plus-a-month range, not its own site.")],
    related=[("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
              "Where the self-serve tiers this piece contrasts against enterprise pricing are laid out in full."),
             ("/bg-090.html", "BG-090", "Six GEO Startups You Have Not Heard of Yet",
              "Includes Evertune and Bluefish AI's fuller profiles, the two enterprise-only names this piece draws its figures from."),
             ("/bg-042.html", "BG-042", "The GEO Funding Boom, Mapped: $300 Million and a Billion-Dollar Valuation in Two Years",
              "The funding behind the vendors now selling at the enterprise tier, and what investors are betting the category becomes.")],
    cta_h="Find out what tier you actually need, not the one being pitched",
    cta_p="Run a real audit first. You will see your own AI-answer coverage before deciding whether a self-serve plan or a bigger conversation is the right next step.",
    body="""  <p>Somewhere above the self-serve pricing pages most of this site's buyer-guide coverage stays inside, sit a smaller number of vendors selling GEO engagements priced by conversation rather than by credit card. Bluefish AI and Evertune are the clearest examples in this category: no self-serve checkout, a demo request as the only call to action, and, per independent reviews rather than either company's own published rate card, annual contracts that reach well into six figures. What that money is actually documented to buy, and when a much smaller check-in from a company is the better answer, is worth being specific about rather than treating "enterprise" as a synonym for "better."</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Drawn from a competitive-landscape research pass dated 13 August 2026. Every price and contract figure below is either published directly by a vendor or attributed to a named independent review; where the two disagree, both figures are shown rather than one being presented as settled. No specific client deal beyond what these sources disclose is referenced or implied.</p>
  </div>

  <h2>The self-serve tiers already cover the same engines</h2>

  <p>The starting point worth being honest about: an enterprise contract in this category rarely buys access to a fundamentally different measurement. Profound's self-serve Growth plan already covers the same category of AI engines its Enterprise tier does, just capped at 3 engines and 100 prompts a month rather than uncapped. Evertune's own published Pro tier, at $800 a month, already runs 100,000 prompts a month across up to 11 models. The gap between that and a $36,000-a-year minimum one independent review reports for Evertune's actual enterprise deals is not explained by better underlying data. It is explained by everything wrapped around that data.</p>

  <h2>What the premium is documented to actually include</h2>

  <p>Across the vendors that disclose anything about their enterprise motion, a consistent shape emerges. Dedicated strategy or consulting hours, rather than a dashboard a client's own team has to interpret alone. Custom prompt sets built around a client's actual buyer journeys and product lines, instead of a generic template applied the same way to every account. Reporting structured to be shared across teams, SEO, PR, product and sometimes legal, seeing the same underlying data rather than each team running its own separate check. And, in the more service-heavy engagements, a remediation motion where the vendor's own team acts on findings, rewriting pages or briefing content teams, rather than only surfacing a problem and leaving the client to solve it. None of this shows up on a self-serve pricing page because none of it scales the way a per-seat SaaS price does; it scales with the vendor's own staff time.</p>

  <h2>The opacity is part of the model, not an oversight</h2>

  <p>Bluefish AI's pricing page is a 404 on purpose, not a broken link. A demo-only, negotiated-price motion lets a vendor price by account size, urgency and competitive pressure rather than committing to one number that every buyer sees. That is standard practice across enterprise B2B software generally, not unique to this category, and it means a prospective buyer should expect to negotiate rather than compare list prices the way they would for a self-serve plan. It also means the figures in this piece, sourced from independent reviews rather than the vendors themselves, should be read as informed estimates, not quoted prices a specific company should expect to pay.</p>

  <h2>When a smaller company does not need this tier</h2>

  <p>If a company operates one brand in one core market, with a marketing team small enough that one or two people can act directly on what a dashboard shows, the self-serve tiers this site covers elsewhere already query the same engines an enterprise contract would. The honest trigger for moving up is not company size on its own. It is whether the work of interpreting the data, building the prompt set, and coordinating across teams has become a real job nobody on staff has the hours to do, or whether the company is managing enough brands, markets or stakeholder groups that a single dashboard stops being enough to keep everyone aligned. Short of that point, the premium buys people and process a smaller team does not yet need to buy.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A six-figure GEO contract is not a bigger version of the same dashboard. It is consulting hours, custom scope, cross-team reporting and sometimes hands-on remediation, sold at a price set by negotiation rather than a published rate card. That is a real and sometimes justified premium for a company managing real complexity. It is not the right first purchase for a company that just needs to know where it stands.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-093
ARTICLES.append(dict(
    slug="bg-093", bid="BG-093", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Buyer Guide", "Small Business", "GEO Tools"],
    title="How to Choose an AI Brand Monitoring Tool on a Small Business Budget",
    h1="How to Choose an AI Brand Monitoring Tool on a <em>Small Business Budget</em>",
    h1_plain="How to Choose an AI Brand Monitoring Tool on a Small Business Budget",
    subtitle="Under roughly $100 a month or a free tier, the buying decision is not about picking a winner off a roundup. It is about checking real engine coverage, whether the free tier is an ongoing product or a trial, and what happens to the bill once you add prompts.",
    meta_desc="Buying criteria for AI brand monitoring on a small budget: real engine coverage vs coming-soon placeholders, whether a free tier is ongoing or a trial, and predictable pricing as you scale.",
    og_desc="A cheap AI visibility tool and a cheap-looking one are not the same purchase. Three things to check before paying for engine coverage that turns out to be a placeholder.",
    ld_desc="Buyer criteria for selecting an AI brand monitoring tool on a small business budget, covering real engine coverage, free-tier durability, and predictable pricing as prompt volume scales.",
    keywords="ai brand monitoring tool small business, cheap ai visibility tool, affordable geo tool, small business ai search tracking, budget ai visibility tool 2026",
    about=["Buyer Guide", "Small Business", "GEO Tools", "Pricing"],
    findings=[("$19.95", "Waikay's monthly entry price, the cheapest named headline figure this category's public pricing pages show"),
              ("$29", "Otterly.AI's Lite plan, which includes only 4 of the engines a buyer might actually want by default"),
              ("EUR 29", "the monthly price of BrandGEO's own Radar plan, one low-cost entry point in this category, cited here as one example among several"),
              ("1", "AI engine (Gemini) covered by BrandGEO's free plan, an ongoing product rather than a time-boxed trial")],
    faq=[("What's the single biggest trap in a cheap AI visibility tool's pricing page?",
          "A headline price that does not include the engines you actually want. Otterly.AI's own pricing page is the clearest documented example in this category: its $29 and $189 tiers include only 4 core engines, and Gemini, Google AI Mode and Claude are each separate paid add-ons that can push the real monthly cost well past the number in the headline."),
         ("Is a free tier worth using on a tight budget?",
          "It depends what kind of free tier it is. Some are ongoing products at a reduced scope, others are time-boxed trials that revert to nothing after a set number of days. BrandGEO's free tier, for example, covers one engine, Gemini, on an ongoing basis rather than expiring, which is a materially different offer than a 14-day trial of the full product. Check which one you are actually looking at before deciding \"free\" solves your problem."),
         ("Does a cheaper tool mean less reliable data?",
          "Not automatically. Price differences in this category mostly track engine count, prompt volume, and go-to-market, self-serve versus demo-gated, rather than measurement rigor on their own. The bigger reliability question, that any single-run visibility score is noisy regardless of price, applies to expensive tools and cheap ones alike."),
         ("What should I ask about before the bill grows past the sticker price?",
          "Ask specifically what happens as you add prompts or engines beyond the starting tier. Credit-based pricing in this category can add meaningfully to the base price once you cross a monthly allotment, and a vendor that cannot answer clearly what the next tier or the next add-on costs is not one you can budget against reliably.")],
    related=[("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
              "The full pricing table this piece pulls its comparison points from."),
             ("/bg-050.html", "BG-050", "Bootstrapped vs. Venture-Backed: Does the Funding Show Up in the Product?",
              "Why the cheapest tools in this category are usually the bootstrapped ones, and what that trade-off actually looks like."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "Why price is not the variable that determines how trustworthy a single score is.")],
    cta_h="See what a low-cost entry point actually covers",
    cta_p="Run your domain through BrandGEO's free check, Gemini only, ongoing, no card required, then decide whether a paid tier is worth adding.",
    body="""  <p>Below roughly $100 a month, or inside a free tier, the AI-visibility buying decision looks less like picking a winner off a roundup and more like checking a handful of specific things a marketing page will not volunteer on its own. Two tools at the same headline price can differ enormously in what actually gets delivered, and the gap usually only becomes visible after checkout, not before.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Pricing figures below are taken directly from vendor pricing pages cited in a competitive-landscape research pass dated 13 August 2026, plus BrandGEO's own published plans as one example among several rather than a recommendation. Nothing here is an endorsement of any single vendor as "the" small-business pick.</p>
  </div>

  <h2>Check real engine coverage, not the marketing count</h2>

  <p>A tool advertising "AI visibility across the leading engines" can mean genuinely different things. Otterly.AI's own pricing page shows its $29 Lite and $189 Standard tiers ship with only 4 core engines included, ChatGPT, Google AI Overviews, Perplexity and Copilot, while Gemini, Google AI Mode and Claude are each separately priced add-ons ranging from $9 to $439 a month depending on tier. A buyer reading only the $29 or $189 headline would not see that without opening the full pricing table. Compare that against a vendor that includes its full named engine set at every tier, since a smaller number of engines fully included is often more useful in practice than a larger advertised count where half of it sits behind a "coming soon" label or a paid unlock.</p>

  <h2>Is the free tier an ongoing product or a trial in disguise?</h2>

  <p>"Free" covers two very different offers in this category. One is a genuinely ongoing product at reduced scope, useful indefinitely even if it never converts to paid. The other is a time-boxed trial, commonly 14 days, that reverts to nothing once it ends, at which point the "free" period was really a sales funnel rather than a standing option. Waikay's $19.95-a-month entry tier includes a free trial in that second sense; Rankscale's Essentials tier at $20 a month rolls unused credits month to month rather than expiring them, a different kind of budget-friendliness worth noticing. BrandGEO's own free plan covers one engine, Gemini, on an ongoing basis rather than a countdown, which matters specifically for a company that wants a standing baseline rather than a one-time trial period.</p>

  <h2>Watch what happens after the headline price</h2>

  <p>The real cost of a plan at this budget tier is rarely the number printed at the top. Credit-based pricing structures in this category commonly charge engines unevenly, one industry pricing guide cites Claude checks costing up to 8 times the base per-check rate on some platforms, and overage on usage-based plans commonly adds 20 to 30 percent to the base price once a monthly allotment is exceeded. Before committing, it is worth asking directly what the bill looks like at double the starting prompt volume or with one more engine added, since a vendor that cannot answer that clearly in a sentence is one that is likely to surprise a small budget later.</p>

  <h2>Where a low-cost paid tier fits</h2>

  <p>Once a free ongoing tier stops answering the question a company actually has, usually because it needs more than one engine, more prompts, or a faster refresh, the honest next step is a low-cost paid entry tier rather than jumping straight to an enterprise conversation. BrandGEO's Radar plan, at EUR 29 a month, sits in roughly the same price band as Otterly.AI's Lite tier and Waikay's entry price, cited here as one option among several a small business can compare on the same criteria above: real engine coverage, an honest free-tier definition, and predictable scaling, rather than on brand recognition alone.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>At a small business budget, the winning criteria are not "cheapest" or "most engines advertised." They are whether the engines you actually need are included at the price you are looking at, whether the free tier is a real standing product or a countdown, and whether the vendor can tell you plainly what the bill looks like once you grow past the starting tier.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-094
ARTICLES.append(dict(
    slug="bg-094", bid="BG-094", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Buyer Guide", "Methodology Transparency", "GEO Tools"],
    title="Free AI Visibility Audit vs Paid Monitoring: When You Actually Need to Upgrade",
    h1="Free Audit vs Paid Monitoring: <em>When You Actually Need to Upgrade</em>",
    h1_plain="Free AI Visibility Audit vs Paid Monitoring: When You Actually Need to Upgrade",
    subtitle="A free one-time audit answers 'am I visible at all.' Paid ongoing monitoring answers 'did that change work, and is a competitor pulling ahead.' They are different questions, and one is not simply a smaller version of the other.",
    meta_desc="A decision framework for free AI visibility audits versus paid ongoing monitoring: what each actually measures, and the honest signals for when a one-time check stops being enough.",
    og_desc="A free audit is a snapshot. Paid monitoring is a trend. Confusing the two is why some buyers pay for a subscription they do not need, and others skip one they do.",
    ld_desc="A decision framework distinguishing free one-time AI visibility audits from paid ongoing monitoring, covering what each measures, their structural limits, and honest signals for when upgrading is warranted.",
    keywords="free ai visibility audit vs paid, when do i need ai search monitoring, free vs paid ai visibility tool, ai brand audit vs monitoring, do i need ongoing ai monitoring",
    about=["Buyer Guide", "GEO Tools", "Methodology Transparency", "Decision Framework"],
    findings=[("1-in-100", "the chance SparkToro measured that the same AI platform returns the same brand list twice for an identical question, the reason a single audit is a snapshot, not a trend"),
              ("1", "reading a free audit gives you, a baseline, not a measurement of whether anything has changed"),
              ("2", "comparable readings, at minimum, required before any number can be called a trend rather than a snapshot"),
              ("$19.95", "the lowest named monthly price this category's public pricing pages show for ongoing monitoring, against $0 for a one-time audit")],
    faq=[("What does a free AI visibility audit actually tell you?",
          "A single reading of whether and how a brand currently appears across a handful of AI engines for a small set of prompts, at one point in time. It is a legitimate baseline answer to 'am I visible at all,' but structurally it cannot tell you whether that answer is improving, worsening, or holding steady, because a single reading has nothing to compare itself against."),
         ("When is a free audit genuinely enough?",
          "When the question is simply whether a brand shows up at all in AI answers, with no active campaign yet underway to change that and no specific competitive threat being tracked. A baseline reading answers that question completely and does not need to repeat itself to stay true."),
         ("When do you actually need paid ongoing monitoring instead?",
          "Once a company is actively trying to move the number, rewriting pages, earning mentions, changing structured data, and needs to know whether a specific change actually worked. Or once there is real, ongoing competitive pressure worth tracking on a schedule rather than checking once and hoping nothing changed since."),
         ("Is a free tool ever actively misleading, rather than just limited?",
          "Not inherently, as long as it is presented honestly as a snapshot rather than implied to be a trend. It becomes misleading only if a single reading is dressed up as proof that a strategy is working, since one reading, given how much AI answers vary between runs, cannot support that claim on its own.")],
    related=[("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "The underlying instability that makes a single audit a snapshot rather than a trend, explained in full."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "What to actually check once you decide a single audit is not enough."),
             ("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
              "The natural next step once ongoing monitoring shows you where to focus.")],
    cta_h="Start with the free baseline, upgrade only if you need to",
    cta_p="Run BrandGEO's free audit first, Gemini, one reading, no card. If you're actively trying to move the number, that's when ongoing monitoring earns its cost.",
    body="""  <p>"Free audit or paid monitoring" is usually framed as a budget question, but it is really a question about what you are trying to find out. A free one-time AI visibility audit and paid ongoing monitoring answer two different questions, and treating one as a smaller version of the other leads to two opposite mistakes: paying for a subscription that does no more than a single free check would have, or skipping a subscription that a real, active effort actually needs.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece draws on SparkToro's disclosed methodology, 600 volunteers submitting 2,961 individual queries across three major AI platforms, and on this site's own recurring coverage of ongoing-monitoring mechanics. No specific vendor's audit or monitoring product is being rated here; the framework applies regardless of which tool a reader is comparing.</p>
  </div>

  <h2>What a one-time audit measures, and what it structurally cannot</h2>

  <p>A free audit gives you a single reading: does a brand show up, in what position, with what sentiment, across a handful of engines, for a small set of prompts, at one moment. That is a real and useful answer to a specific question, "am I visible at all right now," and it does not need repeating to stay true. What it cannot do, no matter how carefully it is run, is tell you whether that answer is getting better or worse, because a single number has nothing to compare itself against. SparkToro's research measured this directly: across 2,961 queries on major AI platforms, there was less than a 1-in-100 chance the same platform returned the same brand list twice for an identical question, and roughly a 1-in-1,000 chance the order matched. One reading is one data point drawn from a system that varies meaningfully between runs. It is a baseline, not a trend.</p>

  <h2>When a free audit is the right amount of tool</h2>

  <p>If the actual question is "does my brand show up in AI answers at all," a single audit answers it completely. That covers a company that has not yet started actively working on AI visibility and wants to know whether it is starting from zero or from something, a company doing a first pass before deciding whether the topic is worth investing in further, or simply curiosity about where things stand today. None of those situations need a second reading to be resolved. Paying for ongoing monitoring in this case buys tracking of a change nobody is trying to make yet.</p>

  <h2>When the picture changes: iteration and competitive pressure</h2>

  <p>The moment the question shifts from "am I visible" to "did that specific change work," a single audit stops being able to answer it, structurally, not just practically. Confirming that a rewritten page, a new structured-data block, or an earned mention actually moved anything requires at least two comparable readings, taken with the same prompts and roughly the same conditions, far enough apart to say the difference reflects the change rather than the platform's own run-to-run noise. The same logic applies to competitive tracking: knowing whether a competitor is gaining ground in AI answers requires watching the gap over time, not a single side-by-side snapshot that could just as easily reflect that day's variance as a real shift.</p>

  <h2>An honest test to run on yourself</h2>

  <p>Two questions cover most of the decision. First, is there an active effort right now, content changes, PR, structured data, competitive response, whose effect you actually need to confirm. Second, is there a specific competitor or market shift worth tracking on a recurring schedule rather than checking on impulse. A "no" to both means a free audit, repeated occasionally whenever curiosity strikes, is a reasonable and sufficient tool. A "yes" to either means a one-time reading cannot answer the question being asked of it, regardless of how well it was run.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A free audit is not a lesser version of paid monitoring. It answers a different, narrower question well, and answers a different question, whether a change worked, poorly, by design, since it has nothing to compare itself against. Upgrade when the question you are actually asking changes, not because a subscription seems like the more serious choice.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-095
ARTICLES.append(dict(
    slug="bg-095", bid="BG-095", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["B2B SaaS", "Buyer Behavior", "AI Search Trends"],
    title="Why B2B Software Buyers Now Start Vendor Research in an AI Chat, Not a Search Bar",
    h1="Why B2B Software Buyers Now Start Vendor Research <em>in an AI Chat</em>, Not a Search Bar",
    h1_plain="Why B2B Software Buyers Now Start Vendor Research in an AI Chat, Not a Search Bar",
    subtitle="51% of B2B software buyers now start their research inside a chatbot instead of a search engine, up from 29% sixteen months earlier. What that means for a SaaS marketing team is not a new keyword list. It's a new definition of what counts as top-of-funnel content.",
    meta_desc="51% of B2B software buyers now start vendor research in a chatbot, up from 29%. What that shift means for a SaaS marketing team's comparison and category content, sourced with methodology disclosed.",
    og_desc="A buyer typing best project management tool for a 20 person agency into ChatGPT before ever opening Google is not a hypothetical. G2's 2026 data says 51% of B2B software buyers already do something like it.",
    ld_desc="An analysis of B2B software buyer research behavior shifting toward AI chat interfaces, narrowing BG-051's general buyer-type findings to the specific implications for B2B SaaS marketing content strategy.",
    keywords="b2b buyer journey ai chat research, saas buyers using chatgpt for vendor research, b2b software vendor research ai, generative engine optimization b2b saas, ai search b2b marketing funnel, best software tools ai chatbot",
    about=["B2B SaaS Marketing", "Buyer Behavior", "AI Search Trends", "Content Strategy"],
    findings=[("51%", "of B2B software buyers who now start research inside an AI chatbot instead of a search engine, up from 29% in April 2025, per G2's 2026 AI Search Insight Report"),
              ("71%", "of B2B software buyers who say they rely on AI chatbots for software research at all, up from roughly 60% seven months earlier, same source"),
              ("89%", "of brands that never appeared in AI category-research answers despite 96% being described accurately when asked about directly, per a Search Engine Journal and Victorious study of 175 brands across 8 platforms"),
              ("84%", "of AI citations that trace to earned third-party coverage rather than a brand's own site, per Muck Rack's 25-million-link study, the reason your own homepage copy is not the lever here")],
    faq=[("Is this the same finding as BG-051?",
          "BG-051 established the general pattern across three buyer segments and cited the same 51% and 71% G2 figures as part of a broader population, Gen Z, and B2B breakdown. This piece stays inside that one segment, B2B software buyers specifically, and asks what the shift actually requires a SaaS marketing team to build differently."),
         ("If we already rank first on Google for our category, are we covered?",
          "Not automatically. A Search Engine Journal and Victorious study of 175 brands across 8 platforms found 96% were described accurately when an AI was asked about them directly, but 89% never appeared at all when the AI was asked a category question like best project management tool for a small agency. Ranking on Google and being recommended inside a chatbot answer are measured by different content."),
         ("Does this mean we should stop investing in traditional SEO content?",
          "No. Google still sends meaningful traffic, and a page built to rank well is not automatically a bad citation source. What changes is the bar for comparison and best of pages specifically: they need checkable claims, real specifics, and enough third-party validation that an AI assembling an answer has a reason to pull from them."),
         ("What's the single most useful thing to check first?",
          "Ask the exact question a buyer evaluating your category would type, with no brand name in it, across a few different AI engines. Whether you show up at all in that answer is a more honest read on your current position than any keyword ranking report.")],
    related=[("/bg-051.html", "BG-051", "Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
              "The general population, Gen Z, and B2B buyers move at three different speeds. This piece narrows to what the fastest-moving one means for a software marketer."),
             ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
              "Five disclosed studies on what actually earns a citation, the research this piece's earned-media point draws from directly."),
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "Eight cited items for what to actually do about a gap like the one this piece describes.")],
    cta_h="See what an AI actually says about your category right now",
    cta_p="Run the exact best-tool-for question a buyer would type, across the engines that matter, and see whether your company shows up. No signup and no card.",
    body="""  <p>A software buyer evaluating a new tool used to start with a Google search, click through three or four blue links, and build a shortlist from whatever ranked. Increasingly, that first step is a single message to ChatGPT, Gemini, or Claude: what's the best project management tool for a 20 person agency, or which CRM handles multi currency invoicing well. The buyer gets a shortlist back before a search engine result page ever loads, and the vendors on that shortlist were chosen by something other than a ten blue link ranking.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>The core B2B figures below come from G2's 2026 AI Search Insight Report, covered at the buyer-type level in <a href="/bg-051.html">BG-051</a>. This piece adds a Search Engine Journal and Victorious study of 175 brands across 8 platforms (published 2026-07-29) and Muck Rack's 25-million-link citation study, both disclosed-methodology sources, to explain what the shift means specifically for what a B2B SaaS marketing team publishes.</p>
  </div>

  <h2>Software buyers moved faster than the general trend</h2>

  <p>Per G2's 2026 AI Search Insight Report, 51% of B2B software buyers now start their research inside an AI chatbot instead of a search engine, up from 29% in April 2025. A broader 71% say they rely on AI chatbots for software research at all, up from roughly 60% about seven months earlier. <a href="/bg-051.html">BG-051</a> places that alongside general-population and Gen Z figures and finds the B2B number moved the fastest of the three, a 22-point shift in about a year for people already inside an active purchase decision.</p>

  <h2>Recognized is not the same as recommended</h2>

  <p>The harder finding sits underneath that headline number. The Search Engine Journal and Victorious study found 96% of brands were described accurately when an AI platform was asked about them directly by name, but 89% never appeared at all when the same platforms were asked a category question, a best X for Y prompt with no brand name in it. An AI knowing your company exists is a low bar. An AI naming you unprompted to someone comparing options is a different and much harder outcome, and it's the one that actually functions like a funnel entry point.</p>

  <h2>What actually earns the citation</h2>

  <p>Muck Rack's study of over 25 million links found 84% of AI citations trace to earned third-party coverage, not a brand's own website. Paid or advertorial content was cited in essentially none of the sample. For a SaaS marketing team, that reframes what a comparison page or a best of list is actually for: it isn't primarily there to convert a visitor who already found you, it's there to become source material an AI can pull from when a buyer who has never heard of you asks the category question.</p>

  <h2>What this changes at the top of the funnel</h2>

  <p>Category-defining content, head-to-head comparisons, and best X tools posts now need to be written as citable answers to the exact question a buyer would type into a chatbot, not just as pages built to rank on a keyword. That means specific, checkable claims rather than vague positioning, and it means the third-party mentions behind those claims, review sites, analyst coverage, community discussion, matter as much as anything published on the company's own domain. A funnel that starts in an AI chat is judged by whether the answer names you, not by whether your landing page loads fast.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>The buyer typing a category question into a chatbot instead of Google is not a future scenario for B2B software specifically, it's already the majority behavior per G2's own data. The content that wins that moment is the content an AI can cite with confidence, which is a different bar than the content that ranks.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-096
ARTICLES.append(dict(
    slug="bg-096", bid="BG-096", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["Travel & Hospitality", "AI Referral Traffic", "AI Search Trends"],
    title="Why Travel Brands Are Seeing Outsized AI Referral Growth",
    h1="Why Travel Brands Are Seeing <em>Outsized</em> AI Referral Growth",
    h1_plain="Why Travel Brands Are Seeing Outsized AI Referral Growth",
    subtitle="Adobe reports AI-driven traffic to travel sites up roughly 200%, ahead of retail's own 138% year-over-year growth in the same dataset. The plausible reason is the query itself: planning a trip is a multi-turn conversation, not a single keyword.",
    meta_desc="Adobe reports AI-driven referral traffic to travel sites up roughly 200%, outpacing retail's 138% year-over-year growth. What that means for a travel brand's AI visibility, with methodology caveats disclosed.",
    og_desc="Plan me a 5 day trip to Lisbon is not one search, it's a conversation with several citation opportunities inside it. That may be why Adobe's data shows travel outpacing even retail's own AI referral surge.",
    ld_desc="An analysis of reported AI referral traffic growth to travel sites, sourced to Adobe Digital Insights, with the multi-turn conversational nature of trip planning offered as the likely mechanism and explicit methodology caveats.",
    keywords="travel ai search referral traffic, ai trip planning brand visibility, adobe ai traffic travel, generative engine optimization travel industry, ai referral traffic growth 2026",
    about=["Travel and Hospitality", "AI Referral Traffic", "Conversational Search", "Generative Engine Optimization"],
    findings=[("~200%", "reported growth in AI-driven referral traffic to travel sites, per an Adobe Business Blog vertical breakout of its Digital Insights dataset, exact comparison window not disclosed in the release"),
              ("138%", "year-over-year growth in AI-referred traffic to retail sites in May 2026, the more fully disclosed comparison figure from the same 1 trillion-plus-visit dataset"),
              ("1,324%", "cumulative growth in AI-referred retail traffic since Adobe began tracking the category in October 2024, the longer trend line behind the shorter travel-specific figure"),
              ("53%", "more time on site AI-referred visitors spend compared to other visitors, an Adobe finding specific to retail and not separately disclosed for travel")],
    faq=[("Where does the roughly 200% figure for travel actually come from?",
          "Adobe's Business Blog, in a vertical breakout of the same Digital Insights dataset behind its retail figures (over 1 trillion visits to US sites). Adobe disclosed a specific year-over-year window and sample size for the 138% retail figure but did not give the same detail for the travel-specific number, so treat roughly 200% as directionally credible and less rigorously disclosed than the retail comparison sitting next to it."),
         ("Why would travel see a bigger jump than retail?",
          "This isn't confirmed by any study, it's the plausible mechanism given how the two purchases differ. Buying a specific product is often a short, single-intent search. Planning a trip involves destination choice, timing, an itinerary, lodging, and logistics, a sequence that maps naturally onto a multi-turn AI conversation rather than one search box entry."),
         ("What does getting cited look like in a multi-turn travel conversation?",
          "Different from a single keyword ranking. If someone asks an AI to plan a 5 day trip to a destination, the answer likely draws on separate sources for the itinerary structure, specific attractions, lodging recommendations, and logistics like getting around, each a distinct citation opportunity rather than one result for one query."),
         ("What should a travel or hospitality brand actually do with this?",
          "Make sure content answers the sub-questions a multi-turn planning conversation would generate, specific, checkable details on timing, cost ranges, and logistics, not just a polished destination overview. Content that only works as a single landing page misses most of the citation opportunities inside a real trip-planning exchange.")],
    related=[("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The broader traffic pattern behind travel's own referral numbers, measured across the wider web."),
             ("/bg-051.html", "BG-051", "Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
              "Who is actually doing this kind of research inside a chatbot, broken down by segment."),
             ("/bg-045.html", "BG-045", "What the People Who Actually Study This Think Is Coming Next",
              "Where researchers expect conversational, multi-step AI queries to head next.")],
    cta_h="See what an AI recommends for your destination or property",
    cta_p="Run the trip-planning question a real traveler would ask and see whether your brand is part of the answer. No signup and no card.",
    body="""  <p>Adobe's Digital Insights team, working from over a trillion visits to US retail sites, reported AI-referred traffic to retail growing 138% year over year as of May 2026, and up 1,324% since it started tracking the category in October 2024. In a separate vertical breakout, Adobe reported AI-driven traffic to travel sites up roughly 200%, ahead of retail's own already large number. Retail's figure came with a disclosed date range and dataset scale. Travel's did not carry the same level of disclosed detail, so the size of the gap between the two is worth treating as directional rather than precise.</p>

  <div class="callout">
    <div class="callout-label">How this was researched, and what it can't tell you</div>
    <p>Both figures trace to Adobe's Digital Insights team and its Business Blog, a disclosed-methodology source built on real traffic data rather than a survey. The retail figure specifies a year-over-year comparison and a dataset of over 1 trillion visits. The travel-specific figure was published as a vertical breakout of the same broader dataset without the same explicit comparison window, so it's labeled here as reported rather than fully disclosed. Neither figure establishes why travel outpaced retail, only that it did in Adobe's data.</p>
  </div>

  <h2>A plausible reason, not a proven one</h2>

  <p>Adobe's release doesn't explain the gap, but the shape of the two purchases offers a reasonable explanation. Buying a known product is frequently a short, single-intent search. Planning a trip is rarely one question. It typically unfolds as destination choice, then timing, then an itinerary, then lodging, then logistics, a sequence that fits a multi-turn AI conversation far more naturally than it fits a single search box entry. That structural difference, not anything specific to travel marketing, is the more likely driver of an outsized number.</p>

  <h2>What a citation looks like when the query has several turns</h2>

  <p>A single keyword search produces one moment where a brand either ranks or doesn't. A prompt like plan me a 5 day trip to a given destination produces an answer built from several distinct pieces, likely destination framing, a day-by-day structure, specific attraction or restaurant recommendations, lodging suggestions, and practical logistics. Each of those pieces is its own citation opportunity. A travel brand that only optimizes one polished destination landing page is competing for a fraction of the actual surface area inside that conversation.</p>

  <h2>The practical shift for a travel or hospitality brand</h2>

  <p>Content needs to answer the sub-questions a real planning conversation generates, not just present a single overview. Specific, checkable details, seasonal timing, realistic cost ranges, how to actually get somewhere once you arrive, give an AI concrete material to cite at more of the points where the conversation branches. This isn't a claim that any specific tactic causes more citations. It's a description of where the citation opportunities plausibly sit, given how the query itself is shaped, and it's a direction worth testing against your own destination or property rather than assuming.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Travel's reported AI referral growth outpacing even retail's own large number is a real, if incompletely disclosed, signal. The more useful takeaway is structural: a trip-planning query has several citation moments inside it, not one, and content built for a single search doesn't cover most of them.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-097
ARTICLES.append(dict(
    slug="bg-097", bid="BG-097", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Local SEO", "Local Service Business", "AI Overviews"],
    title="A Local Service Business Guide to Showing Up in AI Overviews, Not Just Maps",
    h1="A Local Service Business Guide to Showing Up in <em>AI Overviews</em>, Not Just Maps",
    h1_plain="A Local Service Business Guide to Showing Up in AI Overviews, Not Just Maps",
    subtitle="A complete Google Business Profile gets a plumber or a dentist onto the map. It doesn't automatically get them named when someone asks an AI who's good near me. That answer is assembled from more sources than one profile.",
    meta_desc="Why a complete Google Business Profile isn't enough for a local service business to appear in AI answers, and the service area, pricing, review, and credential consistency an AI answer actually pulls from.",
    og_desc="Who's a good plumber near me is answered by an AI pulling from your site, your listings, and your reviews together, not from one profile. Here's what needs to say the same thing everywhere.",
    ld_desc="A practical guide for local service businesses on the consistency of service area, pricing, reviews, and credentials needed across a website and directory listings for AI engines to answer local recommendation queries accurately.",
    keywords="local service business ai overviews, local seo for ai search, ai visibility local business, plumber dentist law firm ai search, google business profile vs ai overviews",
    about=["Local Service Businesses", "AI Overviews", "Local Search Consistency", "Generative Engine Optimization"],
    findings=[("68.01%", "of Google searches ended without a click in early 2026, per SparkToro's Similarweb-panel study, meaning the AI answer itself is often the entire discovery moment for who's a good plumber near me"),
              ("89%", "of brands that never appeared in AI category-research answers despite 96% being described accurately when asked about directly, per a Search Engine Journal and Victorious study, a gap that applies to local service categories as much as national brands"),
              ("0.664-0.709", "the correlation Ahrefs found between branded web mentions and being cited across ChatGPT, Google AI Mode, and Google AI Overviews, evidence for spreading consistent mentions across many sources rather than perfecting one profile"),
              ("6-7 May 2026", "when Google added an Expert Advice block to AI Overviews and AI Mode, pulling first-hand perspectives directly from forums, social platforms, and review sites into the answer itself")],
    faq=[("Isn't a complete Google Business Profile enough to show up in AI answers about local businesses?",
          "It's necessary but not sufficient. A profile controls what shows on Maps and in the local pack. An AI Overview or AI Mode answer to a conversational question like who's a good plumber near me draws on more than one profile, including your own site, reviews, and directory listings, and Google's own Expert Advice block now pulls directly from forums and review platforms. For the profile-specific mechanics, see BG-085."),
         ("What exactly needs to say the same thing across my site, my listings, and my directories?",
          "Four things worth checking directly: the service area you actually cover, whether pricing is stated transparently anywhere public, whether reviews are current and consistent in tone, and whether licensing or credential information is stated the same way everywhere it appears. An AI assembling an answer from multiple sources treats a mismatch as a reason for uncertainty, not as a detail to smooth over."),
         ("Do online reviews actually change what an AI says, or just the star rating shown?",
          "More than the star rating. Google's own Expert Advice block, added to AI Overviews and AI Mode in May 2026, pulls first-hand perspectives directly from forums, social platforms, and review sites into the generated answer. A pattern across your reviews, on service quality, responsiveness, or pricing honesty, can end up reflected in the answer text itself, not just in a star count next to your name."),
         ("How is this different from what BrandGEO's home services or law firm pages already describe?",
          "Those pages describe what BrandGEO tracks for specific local categories. This piece is the underlying method: why a complete profile alone doesn't guarantee an AI recommendation, and what needs to be consistent across every source an AI might draw from. See <a href=\"/ai-visibility-for-home-services.html\">the home services page</a> or <a href=\"/ai-visibility-for-law-firms.html\">the law firms page</a> for the category-specific view.")],
    related=[("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The broader zero-click pattern that makes the AI answer itself, not your listing, the real discovery moment."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "Why checking once isn't enough for a local business either, and what to ask instead of trusting a single score."),
             ("/bg-054.html", "BG-054", "The GEO Content Checklist: What the Disclosed Research Actually Supports",
              "A cited checklist for the content side of this, useful alongside the consistency checks below.")],
    cta_h="Check what an AI actually says about your business",
    cta_p="Ask the exact question a nearby customer would type and see whether you're named, and what's said about you. No signup and no card.",
    body="""  <p>A plumber with a fully verified Google Business Profile, correct hours, real photos, a steady stream of reviews, has done the work Maps rewards. That work doesn't automatically carry over when a customer asks an AI engine who's a good plumber near me instead of opening Maps directly. The AI answering that question is drawing on more than one profile, and a business that's only optimized the profile has covered one source out of several.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece draws on SparkToro's Similarweb-panel zero-click study, a Search Engine Journal and Victorious study of 175 brands across 8 platforms (2026-07-29), Ahrefs' Brand Radar correlation data across 75,000 brands, and Google's own disclosed May 2026 AI Overviews changes. None of these studies isolate local service businesses specifically as a category, so the local application here is a reasonable extension of general findings, not a local-specific study, and is presented that way.</p>
  </div>

  <h2>Maps and an AI answer are not the same surface</h2>

  <p>Ranking in the local pack and being named in a conversational AI answer are related but distinct outcomes, run by different mechanics. <a href="/bg-085.html">BG-085</a> covers the Google Business Profile mechanics directly, categories, attributes, hours, the fields that feed Maps and the local pack. This piece covers the wider surface: what an AI pulls together when it answers a question your profile alone doesn't fully control.</p>

  <h2>What who's a good plumber near me actually pulls from</h2>

  <p>SparkToro's Similarweb-panel study found 68.01% of Google searches in early 2026 ended without a click, meaning for a large share of local queries the AI-generated answer is the entire interaction, not a stepping stone to a website visit. Compounding that, Google added an Expert Advice block to AI Overviews and AI Mode on 6-7 May 2026, pulling first-hand perspectives directly from forums, social platforms, and review sites into the answer text itself. A local business's reputation, not just its profile completeness, is increasingly part of what the AI actually says.</p>

  <h2>The four things worth keeping consistent</h2>

  <p>Service area, stated the same way on your site, your profile, and any directory listing, rather than a vague radius in one place and a specific list of towns in another. Pricing transparency, at least a real range published somewhere public, since an AI has nothing to cite on cost if nothing states one. Reviews, current and consistent in tone across platforms rather than concentrated on one site and thin everywhere else. Licensing and credential information, stated identically wherever it appears, since a mismatch between what your site claims and what a directory or licensing board lists is exactly the kind of discrepancy that undermines confidence in an automated answer.</p>

  <h2>Recognized is not the same as recommended, here either</h2>

  <p>The Search Engine Journal and Victorious study found 96% of brands were described accurately when an AI was asked about them directly by name, but 89% never appeared when the AI was asked a category question with no name attached. That study covered SaaS, legal, healthcare, financial services, and ecommerce rather than home services specifically, but the underlying gap, being known versus being recommended, plausibly applies just as much to a dentist or a law firm as to a national brand. Ahrefs separately found branded web mentions correlate 0.664 to 0.709 with being cited across three major engines, evidence that spreading consistent mentions across many sources matters more than perfecting any single one. For category-specific coverage, see <a href="/ai-visibility-for-home-services.html">the home services page</a> or <a href="/ai-visibility-for-law-firms.html">the law firms page</a>.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A complete Google Business Profile is table stakes for Maps, covered fully in BG-085, but it's one source among several an AI draws from to answer a conversational local question. Consistency across your site, your listings, and your reviews is what closes the gap between being findable and being recommended.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-098
ARTICLES.append(dict(
    slug="bg-098", bid="BG-098", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Competitive Intelligence", "SaaS Marketing", "AI Visibility Measurement"],
    title="How SaaS Companies Should Track Competitor Mentions Across AI Engines",
    h1="How SaaS Companies Should Track <em>Competitor Mentions</em> Across AI Engines",
    h1_plain="How SaaS Companies Should Track Competitor Mentions Across AI Engines",
    subtitle="Whether you're mentioned is the easy question. Who's named alongside you, in what order, and in what tone is the one that actually helps a positioning doc. Here's what to track, how often, and what to do with it.",
    meta_desc="A practical guide for SaaS marketing teams on tracking competitor mentions in AI answers: co-occurrence and tone over raw presence, check cadence by engine, and feeding findings into sales battlecards.",
    og_desc="Being mentioned is the low bar. Who else got named next to you, who came first, and what tone the AI used are the questions that actually change a positioning document or a sales battlecard.",
    ld_desc="A practical framework for B2B SaaS marketing and product marketing teams to track competitor presence, co-occurrence, and framing across AI engines, with check-cadence guidance grounded in disclosed consistency and citation-rate research.",
    keywords="saas competitor tracking ai engines, track competitor mentions chatgpt gemini, ai competitive intelligence saas, competitor monitoring generative engines, sales battlecard ai search",
    about=["Competitive Intelligence", "SaaS Marketing", "AI Visibility Measurement", "Sales Enablement"],
    findings=[("<1 in 100", "chance an AI platform returns the same brand list twice for an identical prompt, per SparkToro's 2,961-query study, the reason a single competitor snapshot is close to meaningless on its own"),
              ("96% / 82% / 55%", "the share of responses ChatGPT, Gemini, and Claude respectively include any citation in, per Muck Rack's 25-million-link study, a spread wide enough that checking one engine can't stand in for the others"),
              ("0.749-0.821", "the cross-platform agreement Ahrefs found in which brands ChatGPT, Google AI Mode, and Google AI Overviews mention, despite genuinely different retrieval mechanics behind each engine"),
              ("89%", "of brands that never appear in AI category-research answers despite being recognized accurately when asked about directly, the gap a presence-only competitor check misses entirely")],
    faq=[("What should we actually be tracking, if not just are we mentioned?",
          "Co-occurrence and framing. When a competitor is named in the same answer as you, note who's listed first, whether the tone toward each company differs, and what specific claim, if any, is attached to each name. A prospect reading that answer is doing early comparison shopping in real time, and the framing is what they're actually absorbing, not just the raw fact that both names appeared."),
         ("How often should we actually check?",
          "By category speed and by engine, not on a single fixed schedule. A category with frequent competitor launches, repositioning, or funding news needs more frequent checks than a stable one. Muck Rack found ChatGPT cites sources in 96% of responses versus 55% for Claude, so an engine that rarely cites needs a different check rhythm than one that almost always does."),
         ("Does the exact order competitors appear in actually matter?",
          "Treat it as a weak signal. SparkToro's research found roughly a 1 in 1,000 chance an AI platform returns the same list in the same order twice for an identical prompt. A single run showing you listed second instead of first is closer to noise than a finding. A pattern that holds across several runs over time is worth acting on; one run is not."),
         ("What do we do with what we find?",
          "Feed it directly into competitive positioning documents and sales battlecards, not just an internal dashboard. If a prospect asking an AI to compare tools functions as an early-stage vendor comparison, then the framing that comparison surfaces is functionally part of your competitive narrative, whether or not your sales team ever sees the actual chat transcript.")],
    related=[("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "The four engine-specific retrieval mechanics behind why checking one engine can't stand in for the rest."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "The consistency research behind why a single competitor snapshot needs to be repeated, not trusted on the first run."),
             ("/bg-051.html", "BG-051", "Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
              "The buyer-behavior data behind why a prospect's AI chat is functionally part of your funnel now.")],
    cta_h="See who gets named alongside you right now",
    cta_p="Run the comparison question a prospect would actually type and see which competitors show up next to you, and how. No signup and no card.",
    body="""  <p>A product marketing team asking is my competitor mentioned more than I am is asking a simpler question than the one that actually matters. A prospect who types best alternative to a competitor's product into ChatGPT or asks Gemini to compare two tools isn't looking for a yes or no on either brand. They're reading a framed comparison, and that framing, who's named first, what's said about each company, whether the tone leans positive or hedged, is the thing a competitive intelligence program should actually be built to catch.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This piece draws on SparkToro's 2,961-query consistency study, Muck Rack's 25-million-link citation study, and Ahrefs' Brand Radar correlation data across 75,000 brands, all disclosed-methodology sources. None of them study SaaS competitive tracking as a use case directly, so the guidance below is a practical application of what those studies measured, not a finding from a study built for this exact purpose.</p>
  </div>

  <h2>Presence is the wrong first question</h2>

  <p>Track co-occurrence, not just mentions. When a competitor is named in the same answer as you, record who's listed first, what specific claim or feature is attached to each name, and whether the tone differs between the two. A monitoring setup that only logs whether your brand appeared is measuring a fact a prospect never actually experiences. What the prospect experiences is the full comparison, and that's the unit worth capturing.</p>

  <h2>Order is a noisy signal, so weight it lightly</h2>

  <p>SparkToro's study of 2,961 queries across three major AI platforms found less than a 1 in 100 chance the same platform returns the same brand list twice for an identical question, and roughly a 1 in 1,000 chance the list comes back in the same order. A single run showing a competitor listed ahead of you is closer to one roll of a die than a competitive finding. What's worth tracking is whether that ordering holds across several runs spread over a few days, not what any one run happens to show.</p>

  <h2>Set your check cadence by category speed, and by engine</h2>

  <p>A category with frequent competitor launches, funding news, or repositioning needs more frequent checks than a stable, slow-moving one, the same way a PR team monitors news cycles at different intensities depending on what's happening. Engine choice matters too: Muck Rack's study found ChatGPT includes a citation in 96% of responses, Gemini in 82%, and Claude in only 55%, and Ahrefs found only 0.749 to 0.821 cross-platform agreement in which brands even get mentioned across three major engines. Checking a single engine and assuming it represents the others misses real variance, both in citation rate and in which competitors actually surface.</p>

  <h2>Feed it into battlecards, not just a dashboard</h2>

  <p>A finding that sits in a monitoring tool and never reaches sales has no practical value. If a competitor consistently gets framed with a specific advantage in AI-generated comparisons, that framing belongs in the competitive positioning document and the sales battlecard, because a prospect who ran that comparison before ever talking to a sales rep is arriving with that framing already in mind. Treating an AI comparison as functionally an early-stage vendor evaluation, which the buyer behavior data increasingly supports, means the output of this tracking is a talking point for sales, not just an internal metric.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Am I mentioned is the question a dashboard answers easily and a prospect never actually asks. Who's named alongside me, in what order, and in what tone is closer to what a real buyer sees, and it's the version worth building a tracking cadence, and a battlecard update habit, around.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-099
ARTICLES.append(dict(
    slug="bg-099", bid="BG-099", date="2026-08-14", date_label="August 14, 2026", read=8,
    tags=["News Roundup", "Quarterly Series", "AI Search Trends"],
    title="What Changed in AI Search This Quarter: Q3 2026",
    h1="What Changed in AI Search This Quarter: <em>Q3 2026</em>",
    h1_plain="What Changed in AI Search This Quarter: Q3 2026",
    subtitle="The first in a series we intend to keep running every quarter. A scannable roundup of what actually happened in AI search between roughly July and August 2026, with links to the deeper coverage where it exists.",
    meta_desc="What changed in AI search in Q3 2026: Google's AI Overviews overhaul, FAQ rich results, GPT-5.6's citation reshuffle, Perplexity's share decline, and more. First in a recurring quarterly roundup series.",
    og_desc="AI Mode hit a billion monthly users. Google rebuilt how AI Overviews cite sources. A publisher stopped publishing entirely. This is the first in a quarterly roundup of what actually changed in AI search.",
    ld_desc="The first entry in a recurring quarterly roundup summarizing verifiable developments in AI search and generative engine optimization for Q3 2026, with links to fuller sibling coverage where available.",
    keywords="ai search news roundup q3 2026, what changed in geo this quarter, ai overviews update 2026, generative engine optimization news, quarterly ai search summary",
    about=["AI Search News", "Quarterly Roundup", "Generative Engine Optimization", "Platform Changes"],
    findings=[("1 billion", "monthly users AI Mode passed at Google I/O on 19 May 2026, roughly a year after its US debut, with query volume more than doubling every quarter"),
              ("5", "structural changes Google made to AI Overviews and AI Mode on 6-7 May 2026, including moving inline citations next to the specific sentence they support"),
              ("58%", "the drop in click-through on the number one organic result when an AI Overview appears, per Similarweb-based tracking, up from a measured 34.5% drop in April 2025"),
              ("76% to 53%", "the fall in ChatGPT's worldwide referral-traffic share between June 2025 and May 2026, per Similarweb, evidence the referral pie is splitting across more engines rather than ChatGPT itself shrinking")],
    faq=[("Is this a complete list of everything that happened in AI search this quarter?",
          "No, it's a selective roundup of developments with a real source behind them, chosen for how much they change what a brand or marketing team should actually do. Plenty of smaller platform tweaks and vendor announcements from the quarter aren't included here."),
         ("Why doesn't this article explain the FAQ rich-results deprecation or GPT-5.6's citation changes in full?",
          "Both are covered in their own dedicated pieces elsewhere in this batch, linked below where each is mentioned. This roundup is intentionally short per item, pointing to the fuller writeup rather than repeating it."),
         ("Will this actually run every quarter?",
          "That's the intent stated here explicitly: this is the first entry in a series meant to repeat on a quarterly cadence, rounding up what changed since the last one rather than restating the whole history of AI search each time.")],
    related=[("/bg-043.html", "BG-043", "What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
              "The full detail behind this roundup's first item, the five-part May 2026 update."),
             ("/bg-051.html", "BG-051", "Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
              "The full breakdown behind this roundup's B2B buyer-behavior item."),
             ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The broader traffic pattern several of this quarter's developments sit inside.")],
    cta_h="Check where your brand stands going into next quarter",
    cta_p="Run your own domain through the engines covered in this roundup and see the answer on screen. No signup and no card.",
    body="""  <p>This is the first in a series we intend to keep running each quarter: a short, scannable summary of what actually changed in AI search, sourced to something checkable rather than to another vendor's unsourced GEO statistics post. Roughly July through August 2026 is the window covered here. Where a development is explored in full elsewhere in this batch, this roundup links to that piece rather than re-explaining it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Each item below traces to a named source, disclosed where the source discloses it, flagged as reported or undisclosed where it doesn't. This is a synthesis and news-roundup piece, not new original research, drawing on this site's own research pass plus the deeper sibling articles linked in each section.</p>
  </div>

  <h2>Google rebuilt how AI Overviews and AI Mode work</h2>
  <p>On 6-7 May 2026 Google shipped five structural changes described as one of the biggest updates since AI Overviews launched: inline citations now sit next to the specific sentence they support instead of bundled at the end, hover previews show the site name, a new Expert Advice block pulls first-hand perspectives from forums and reviews, and a new end-of-answer section surfaces curated article links. Days later, at Google I/O on 19 May, AI Mode passed 1 billion monthly users about a year after its US debut. Full detail in <a href="/bg-043.html">BG-043</a>.</p>

  <h2>FAQ rich results went away</h2>
  <p>Google's move away from FAQ-schema rich results in standard search carries direct implications for how content is structured for GEO, since a tactic built around one specific markup type stops paying off the way it used to. Covered in more depth in <a href="/bg-058.html">BG-058</a>.</p>

  <h2>ChatGPT's citations got reshuffled</h2>
  <p>An update tied to GPT-5.6 reportedly changed how ChatGPT selects and orders the sources it cites in a response, a meaningful shift for anyone tracking citation position as a metric. Covered in more depth in <a href="/bg-059.html">BG-059</a>.</p>

  <h2>Perplexity's referral share slipped</h2>
  <p>The wider backdrop here, measured by Similarweb, is that ChatGPT's own worldwide referral-traffic share fell from roughly 76% in June 2025 to about 53% in May 2026, evidence that the referral pie is splitting across more engines rather than any single one shrinking outright. Perplexity's own share movement within that redistribution is covered in more depth in <a href="/bg-060.html">BG-060</a>.</p>

  <h2>An AI browser crossed ten million users</h2>
  <p>A dedicated AI browser reportedly passed the 10 million user mark this quarter, a milestone worth tracking as browsing itself becomes another AI-mediated surface, not just the chat box. Covered in more depth in <a href="/bg-063.html">BG-063</a>.</p>

  <h2>Publishers kept talking about opting out entirely</h2>
  <p>Axios reported on 31 July 2026 that some publishers are weighing whether to opt out of Google Search crawling altogether, given a traffic collapse without a comparable AI-referral offset for most content categories. In a related sign of the same tension, Reddit's stock dropped on 22 July 2026 reporting that it may not renew its roughly 60 million dollar a year data-licensing deal with Google, since Google's AI answers are simultaneously cutting into the referral traffic that licensing payment was supposed to offset.</p>

  <h2>B2B buyers kept moving into chatbots</h2>
  <p>G2's 2026 AI Search Insight Report figures held as the quarter's clearest buyer-behavior data point: 51% of B2B software buyers now start research inside an AI chatbot instead of a search engine, up from 29% in April 2025. Full breakdown by buyer type in <a href="/bg-051.html">BG-051</a>.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway, and what comes next</div>
    <p>Q3 2026's developments point the same direction from several angles: citation mechanics keep changing platform by platform, referral traffic keeps redistributing rather than simply growing, and buyer behavior keeps moving earlier into AI chat. This is the first entry in what we intend to keep running as a quarterly series, checking each quarter's developments against the same sourcing standard rather than assuming last quarter's numbers still hold.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-100
ARTICLES.append(dict(
    slug="bg-100", bid="BG-100", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["Predictions", "AI Search Trends", "Industry Analysis"],
    title="Five Predictions for How AI Search Visibility Changes by the End of 2026",
    h1="Five Predictions for How AI Search Visibility Changes <em>by the End of 2026</em>",
    h1_plain="Five Predictions for How AI Search Visibility Changes by the End of 2026",
    subtitle="Not a forecast dressed up as certainty. Five house calls, the reasoning behind each one, and what would have to happen for it to turn out wrong.",
    meta_desc="Five hedged predictions for how AI search visibility changes by the end of 2026, each with the reasoning behind it and exactly what would prove it wrong.",
    og_desc="Not certainties. Five house predictions on AI search visibility through the end of 2026, built from disclosed data on citation rates, funding and market-size disagreement, each naming what would prove it wrong.",
    ld_desc="A hedged set of five predictions for how AI search visibility changes by the end of 2026, covering engine fragmentation, citation-mechanic churn, agentic commerce, market measurement and GEO-vendor consolidation, each stated with its disconfirming condition.",
    keywords="ai search predictions 2026, future of generative engine optimization, GEO predictions 2026, AI visibility trends, AEO forecast",
    about=["AI Search Trends", "Generative Engine Optimization", "Industry Analysis", "Predictions"],
    findings=[("53%", "ChatGPT's worldwide referral-traffic share in May 2026, down from about 76% a year earlier, per Similarweb-tracked data"),
              ("36%", "the spread between the two largest disclosed 2026 global GEO market-size estimates, for the same year"),
              ("$300M+", "disclosed venture funding across six GEO-native vendors in under two years, one already a reported unicorn"),
              ("<1 in 100", "chance an AI platform returns the same brand list twice for an identical prompt, per SparkToro, the reason a single composite score is fragile")],
    faq=[("Are these predictions guaranteed to happen?",
          "No, and none of them are presented that way. Each one carries the reasoning it is built on and, separately, the specific condition that would prove it wrong. Treat this as BrandGEO's own hedged read of where the disclosed data points, not a forecast with a confidence interval attached."),
         ("How is this different from BG-045's roundup of what researchers think is coming next?",
          "BG-045 gathers named outside experts, Lily Ray, Glenn Gabe, Mike King, plus one industry survey, and reports what each of them says. This piece is BrandGEO's own view, built from the same category of disclosed research this site tracks, not a summary of somebody else's commentary."),
         ("Which of these five predictions is most likely to be wrong?",
          "Prediction three, on agentic and shopping AI becoming a distinct visibility surface, is the most timing-dependent. The infrastructure (the Universal Commerce Protocol, Copilot Checkout) shipped in 2026, but real adoption at scale is the part still unproven, and a slow rollout would not falsify the underlying mechanism, only the timeline."),
         ("What would change these predictions before the year is out?",
          "Any of the five disconfirming conditions listed above: engines converging in citation behavior, platform mechanics holding stable for two straight quarters, agentic adoption staying niche, an independent analyst firm settling the market-size question, or the current GEO vendor roster ending the year with no further shutdown or merger. Each is independently checkable, which is the point of stating them.")],
    related=[("/bg-045.html", "BG-045", "What the People Who Actually Study This Think Is Coming Next",
              "The named-expert roundup this piece's own house predictions are built alongside, not restating."),
             ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
              "Why a single composite AI visibility score is fragile, the same instability behind prediction one below."),
             ("/bg-042.html", "BG-042", "The GEO Funding Boom, Mapped: $300 Million and a Billion-Dollar Valuation in Two Years",
              "The funding concentration behind why another GEO vendor shutdown or merger is the more likely bet.")],
    cta_h="See your own number, not someone else's case study",
    cta_p="Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card.",
    body="""  <p>Predicting where AI search visibility goes by year end is a different exercise than reporting what has already happened, and it should read differently too. <a href="/bg-045.html">BG-045</a> rounded up what named outside researchers and one industry survey currently believe. This is not that. These five are BrandGEO's own house view, built on the same disclosed studies and platform changes this site has been tracking, hedged the way any honest prediction about a two-year-old category has to be. Each one carries the reasoning behind it and, just as important, what would have to happen for it to turn out wrong.</p>

  <div class="callout">
    <div class="callout-label">How this was built</div>
    <p>Drawn from the disclosed platform changes, funding data, and correlation studies tracked in this site's 13 August 2026 research pass, not from a separate forecasting model or a survey of our own. Where a prediction rests on a trend already visible in the data, that is stated. Where it rests on a read of the industry rather than a number, that is stated too.</p>
  </div>

  <h2>1. Fragmentation increases, and one visibility score matters less than per-engine tracking</h2>
  <p>The disclosed evidence already points this way. Muck Rack's 25-million-link study found ChatGPT cites a source in 96% of responses, Gemini 82%, and Claude 55%, three genuinely different rates, not three implementations of the same behavior. Similarweb-tracked data shows ChatGPT's worldwide referral share falling from roughly 76% in June 2025 to about 53% in May 2026 even as its raw visit count held flat, meaning the referral pie is splitting across more engines rather than any one engine losing ground outright. Our prediction: reporting keeps drifting toward per-engine numbers as the primary unit, and single composite scores, already undercut by SparkToro's under-1%-consistency finding, become something vendors keep publishing and buyers keep learning to distrust. What would prove this wrong: the engines converging toward similar citation rates and retrieval behavior over the next several months.</p>

  <h2>2. Citation mechanics keep outrunning published GEO advice</h2>
  <p>Google shipped five structural changes to AI Overviews and AI Mode in a single update on 6-7 May 2026, moving inline citations to sit next to the specific sentence they support instead of bundled at the end. Gemini's grounding billing model changed from a flat rate to usage-based pricing on 5 January 2026. Meanwhile the single most confidently repeated piece of 2025 GEO advice, add schema markup to get cited, was directly contradicted by a matched-control study of 1,885 pages that found no statistically significant citation lift on any platform tested. Our prediction: this pattern continues, so process and monitoring keep beating any specific tactic published as a fixed rule. What would prove this wrong: the major engines' retrieval mechanics holding materially stable for two consecutive quarters.</p>

  <h2>3. Agentic and shopping AI becomes a visibility surface of its own</h2>
  <p>The Universal Commerce Protocol, co-developed by Google and Shopify and backed by Walmart, Target, Visa, Mastercard, Amex and Stripe, lets an AI agent complete checkout without a human navigating a site. Copilot Checkout launched in the US on 8 January 2026. Daydream, a consumer AI shopping-discovery agent, exited beta with 1.5 million-plus shoppers and 25-plus signed apparel brands. None of that is the same measurement problem as whether ChatGPT mentions a brand in a chat answer. Our prediction: brands treating agentic surfaces as a subset of chat-answer GEO will find the two do not fully transfer. What would prove this wrong: adoption staying genuinely niche through year end, or existing chat-visibility work carrying over cleanly.</p>

  <h2>4. Market size and ROI measurement stay unresolved through year end</h2>
  <p>Three named market-research firms currently put the 2026 global GEO market at $1.09 billion, $1.48 billion, and an implied $900 million to $1 billion, a spread of up to 36% for the same year, from sources that do not disclose comparable methodology. A Brainlabs analysis published 20 April 2026 argues the concept of "ranking" does not translate to AI search at all, and recommends tracking direction over a precise score. Our prediction: no single number settles this by year end, and Conductor's own self-reported "94% of CMOs increasing AEO spend" figure keeps running ahead of any shared agreement on what is actually being measured. What would prove this wrong: an independent analyst firm publishing primary research the category actually converges around.</p>

  <h2>5. At least one more GEO tool consolidates or shuts down</h2>
  <p>More than $300 million in disclosed venture funding has gone into six GEO-native vendors in under two years, alongside Profound's reported $1 billion valuation, in a category whose own market-size estimates disagree by more than a third. <a href="/bg-064.html">BG-064 already covers one shutdown</a> in this space. Our prediction: it is not the last one this year, whether through acquisition, a quiet wind-down, or a bootstrapped vendor losing ground to venture-funded competitors selling below cost. What would prove this wrong: the roughly ten GEO-native vendors named in our own competitive research all still operating independently when 2026 closes.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Two of these five, fragmentation and agentic surfaces splitting from chat, are already visible in the disclosed data, not just guesses about the future. Two more, unresolved measurement debates and another consolidation, are extrapolations from trends already in motion. None of them is a certainty, and each one names exactly what would have to happen to prove it wrong, which is the only honest way to publish a prediction in a category this young.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-101
ARTICLES.append(dict(
    slug="bg-101", bid="BG-101", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["AI Search Trends", "Market Share", "Industry Analysis"],
    title="The AI Chat Market Is Not Just a ChatGPT Story Anymore",
    h1="The AI Chat Market Is Not Just a <em>ChatGPT Story</em> Anymore",
    h1_plain="The AI Chat Market Is Not Just a ChatGPT Story Anymore",
    subtitle="ChatGPT still gets more traffic than any other AI chat engine. Its share of that traffic is reportedly shrinking anyway, which makes optimizing for one engine a bet against the trend, not a safe default.",
    meta_desc="ChatGPT still leads AI chat traffic, but its referral share fell from about 76% to 53% in a year per Similarweb data, while Gemini and Claude grow fast off smaller bases.",
    og_desc="ChatGPT is still the biggest single AI chat engine by most measures. Its own referral share fell from roughly 76% to 53% in a year. Both of those are true, and optimizing for only one of them is a shrinking-share bet.",
    ld_desc="An analysis of AI chat market-share dynamics, contrasting ChatGPT's continued lead with its declining referral-traffic share and the faster percentage growth of Gemini and Claude, and what that means for single-engine GEO strategy.",
    keywords="ai chatbot market share 2026, chatgpt vs gemini vs claude market share, ai search engine market share, generative engine optimization multi engine strategy",
    about=["AI Search Trends", "Market Share", "Generative Engine Optimization", "Industry Analysis"],
    findings=[("53%", "ChatGPT's worldwide referral-traffic share in May 2026, down from about 76% in June 2025, per Similarweb-tracked data"),
              ("1 billion", "monthly users Google AI Mode passed by May 2026, about a year after its US debut, with query volume more than doubling every quarter"),
              ("96%, 82%, 55%", "citation frequency for ChatGPT, Gemini and Claude respectively, per Muck Rack's 25-million-link study, a different metric than usage share"),
              ("51%", "of B2B software buyers who now start research inside an AI chatbot instead of a search engine, up from 29% in April 2025, per G2")],
    faq=[("What percentage of the AI chat market does ChatGPT actually hold?",
          "It depends what is being counted, and most sources do not say. Industry trackers commonly cite a range of roughly 60% to 75%, but that figure moves depending on whether it measures active users, session volume, or web referral traffic, and different trackers rarely disclose which. The one figure in this piece with a named, disclosed methodology is Similarweb's referral-share data, which is not the same measurement as total usage share."),
         ("Is ChatGPT's usage actually shrinking?",
          "No. Similarweb-tracked data shows its total visit count held roughly flat even as its referral share fell from about 76% to 53% over a year. The overall pie appears to be growing and splitting across more engines, not ChatGPT losing users outright."),
         ("Should I stop optimizing for ChatGPT?",
          "No. It remains the largest single audience by most available measures. The point is that optimizing only for ChatGPT while its share of the category erodes is a shrinking-share bet, not a neutral or safe default, and multi-engine tracking becomes more relevant with each quarter that passes."),
         ("Where can I read more about Gemini and Claude's specific growth?",
          "This piece focuses on the market-share picture across all three. BG-061 covers Gemini's growth in more depth, and BG-062 covers Claude's, both worth reading alongside this one rather than instead of it.")],
    related=[("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "The engine-by-engine retrieval mechanics behind why citation rates diverge as much as usage share does."),
             ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
              "The G2 buyer-behavior figure this piece draws on, covered there in fuller context."),
             ("/bg-045.html", "BG-045", "What the People Who Actually Study This Think Is Coming Next",
              "Where the self-reported AEO investment survey figures come from, a different kind of number than usage share.")],
    cta_h="See your own number, not someone else's case study",
    cta_p="Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card.",
    body="""  <p>Ask most marketers which AI engine to optimize for and the answer arrives immediately: ChatGPT, because it is the biggest. That is still true by most measures. It is also becoming a less complete answer every quarter, and treating it as settled is a bet against the direction the data is actually moving, not a neutral default.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Drawn from Similarweb-tracked worldwide referral-traffic data, Google's own May 2026 I/O announcement, Muck Rack's disclosed 25-million-link citation study, and G2's 2026 AI Search Insight Report, all covered in this site's 13 August 2026 research pass. Where a figure's underlying methodology was not independently verifiable in that pass, that is flagged rather than presented as settled.</p>
  </div>

  <h2>The "60 to 75%" figure is real, and also not one number</h2>
  <p>Industry trackers commonly cite ChatGPT as holding somewhere between 60% and 75% of AI-chat usage, but that range moves depending on what is actually being counted, active users, session volume, web referral traffic, or app downloads, and different trackers rarely disclose which. The one figure in this research pass with a named, disclosed methodology behind it is Similarweb's: ChatGPT's worldwide web-traffic referral share fell from roughly 76% in June 2025 to about 53% in May 2026, even as its total visit count held roughly flat. That is not ChatGPT losing users. It is the referral pie splitting across more engines while ChatGPT's own slice of it shrinks, a meaningfully different story than the flat "still the biggest, ignore the rest" framing usually attached to this category.</p>

  <h2>Growth off a smaller base still moves the picture</h2>
  <p>Google's AI Mode passed 1 billion monthly users by 19 May 2026, roughly a year after its May 2025 US debut, with query volume reported to more than double every quarter, and Gemini 3.5 Flash became the default model powering it globally. None of that alone proves Gemini is catching ChatGPT in absolute terms, the two are different products measured different ways, but it does show a second major engine adding audience at a pace worth tracking rather than dismissing. <a href="/bg-061.html">BG-061 covers Gemini's growth specifically</a>, and <a href="/bg-062.html">BG-062 covers Claude's</a>, in more detail than fits here.</p>

  <h2>Citation behavior diverges even more than usage does</h2>
  <p>Usage share and citation behavior are two different measurements, and conflating them is a common mistake. Muck Rack's disclosed study of more than 25 million links found ChatGPT cites a source in 96% of its responses, Gemini in 82%, and Claude in just 55%, a genuinely large spread in how often each engine backs its answer with a link at all, independent of how many people are asking it questions in the first place. A brand invisible to Claude's citations is not necessarily invisible to Claude's users, since Claude answers plenty of questions without citing anything. That is a separate risk from the usage-share question and worth tracking on its own.</p>

  <h2>What this means for where GEO effort actually goes</h2>
  <p>G2's 2026 AI Search Insight Report found 51% of B2B software buyers now start their research inside an AI chatbot instead of a search engine, up from 29% in April 2025, and separately that 71% say they rely on AI chatbots for software research at all, up from roughly 60% about seven months earlier. That is real, fast-growing buyer behavior spread across whichever chat engine a given buyer happens to prefer, not concentrated in one. Optimizing only for ChatGPT because it currently gets the most traffic is optimizing for where the market was a year ago, not where the growth is happening now.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>ChatGPT is still the largest single AI chat engine by most available measures, and none of this argues otherwise. It argues that "largest" and "safe default" are not the same claim, and the one disclosed trend line available, a referral-share drop from roughly 76% to 53% in a year, points toward multi-engine tracking mattering more with each quarter that passes, not less.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-102
ARTICLES.append(dict(
    slug="bg-102", bid="BG-102", date="2026-08-14", date_label="August 14, 2026", read=6,
    tags=["AEO", "CMO Survey", "Terminology"],
    title="94 Percent of CMOs Say They Are Increasing AEO Spend. Few Can Say What AEO Means.",
    h1="94 Percent of CMOs Say They Are Increasing AEO Spend. <em>Few Can Say What AEO Means</em>.",
    h1_plain="94 Percent of CMOs Say They Are Increasing AEO Spend. Few Can Say What AEO Means.",
    subtitle="Conductor's own survey found near-universal budget intent for 2026. It did not test whether marketing leaders agree on what AEO actually covers, and this site's own three years of terminology writing suggests most do not.",
    meta_desc="94% of CMOs plan to increase AEO spend in 2026, per Conductor's own vendor-sponsored survey. What that spend actually buys is still genuinely unsettled industry-wide.",
    og_desc="94% planning to spend more on AEO in 2026 is a real signal about budget intent. It says nothing about whether the people spending it agree on what AEO actually means, and mostly they do not.",
    ld_desc="An analysis of Conductor's 94% CMO AEO-investment survey figure set against genuine industry confusion over the AEO, GEO and SEO terminology split, with a practical, gradable definition a marketing team could align on before spending.",
    keywords="cmo aeo spend survey, what does aeo mean answer engine optimization, aeo vs geo vs seo, answer engine optimization definition, aeo budget 2026",
    about=["AEO", "Generative Engine Optimization", "Marketing Budgets", "Terminology"],
    findings=[("94%", "of marketing leaders who plan to increase AEO or GEO investment in 2026, per Conductor's own State of AEO and GEO report"),
              ("56%", "who already called their 2025 AEO or GEO investment high or significant, with 38% calling it mid-range"),
              ("~12%", "share of digital marketing budgets Conductor's survey reports is now allocated to AI visibility and optimization"),
              ("3", "overlapping terms in active industry use for roughly the same discipline, SEO, AEO and GEO, with no consistent shared definition across vendors")],
    faq=[("What is AEO, actually?",
          "Answer Engine Optimization: getting content surfaced as the direct answer on an answer-style surface. It predates GEO and has always covered more ground, including traditional featured snippets and voice assistants, not only generative AI chat."),
         ("Is AEO the same thing as GEO?",
          "Not by original definition, but industry usage has drifted them back together. GEO was coined specifically for generative AI systems when the field's founding academic paper introduced the term. Most vendors now use AEO and GEO more or less interchangeably in their own marketing, sometimes on the same pricing page, which is exactly the confusion this piece is naming."),
         ("Is the 94% figure independently verified?",
          "No. It comes from Conductor's own State of AEO and GEO report, a vendor-sponsored survey of marketing leaders, not an independent analyst study. That does not make it meaningless, it is a real signal of budget intent and sentiment, just a narrower and softer claim than 'AEO measurably works.'"),
         ("How should a CMO's team define success before spending the budget?",
          "Agree in writing, before spending, on which surfaces count, what counts as a citation, and what the success metric actually is. A team that answers those three questions has a shared definition. A team that does not will have budget intent and no way to tell, come year end, whether any of it worked.")],
    related=[("/bg-045.html", "BG-045", "What the People Who Actually Study This Think Is Coming Next",
              "The 94/97/56 survey figures in full, plus the named researchers pushing back on treating this discipline as simple."),
             ("/bg-040.html", "BG-040", "Is GEO Just SEO With a New Name? We Checked What 8 Legacy SEO Tools Actually Built",
              "What nine legacy tools actually built when they added an AI-visibility feature, relevant to what any AEO budget line is really buying."),
             ("/bg-005.html", "BG-005", "GEO vs SEO: The Fundamental Difference",
              "This site's earlier line between GEO and SEO, the definitional groundwork this piece builds on.")],
    cta_h="Define it before you spend it",
    cta_p="Whatever your team decides AEO covers, checking what ChatGPT, Gemini, Claude and the rest currently say about your brand takes the same five minutes either way. See it for yourself, no signup and no card.",
    body="""  <p>Ninety-four percent is a big number to build a budget line around. Conductor's own State of AEO and GEO in 2026 survey found that share of marketing leaders plan to increase AEO or answer-engine-optimization investment this year, with 56% already calling their 2025 spend high or significant. What the survey did not test, and what a walk through this site's own writing on the terminology confirms, is whether those same leaders would give the same answer if asked what AEO actually covers.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>The 94%, 56% and roughly-12%-of-budget figures below trace to Conductor's own State of AEO and GEO in 2026 report, a vendor-sponsored survey of marketing leaders, not an independent analyst study. That distinction is preserved throughout rather than smoothed into "the industry says." The definitional discussion draws on this site's own <a href="/bg-005.html">earlier GEO-vs-SEO piece</a> and <a href="/bg-040.html">audit of what legacy SEO tools built</a>. Current as of 13 August 2026.</p>
  </div>

  <h2>The number, and what it is and is not</h2>
  <p>Conductor's survey reports 94% of marketing leaders plan to increase AEO or GEO investment in 2026, 56% already described 2025 investment as high or significant, 38% called it mid-range, and roughly 12% of digital marketing budgets are now allocated to AI visibility and optimization work. These are self-reported figures from a report published by a company that sells an AI-visibility product, worth stating plainly rather than presenting as independent fact. What the numbers establish reliably is budget intent and sentiment at scale, a real signal, just a narrower and softer one than "AEO measurably works."</p>

  <h2>What AEO is supposed to mean, and where it splits from GEO</h2>
  <p>Answer Engine Optimization predates Generative Engine Optimization as a term and has always covered slightly more ground: getting content surfaced as the direct answer on any answer-style surface, traditional featured snippets, voice assistants, and now AI chat and AI Overview responses alike. GEO narrowed the target specifically to generative AI systems, ChatGPT, Gemini, Claude, Perplexity, when the field's founding academic paper introduced the term in 2023. In practice, industry usage since has drifted back together: most vendors, including <a href="/bg-040.html">the nine legacy SEO platforms that added an AI-visibility module in the past 18 months</a>, use AEO and GEO more or less interchangeably in their own marketing. <a href="/bg-005.html">This site's own earlier explainer</a> drew the GEO-vs-SEO line clearly; the AEO-vs-GEO line has never been drawn with the same consistency industry-wide, and that is the actual gap this piece is naming.</p>

  <h2>Why the confusion is a real risk, not a pedantic complaint</h2>
  <p>A budget line with no shared definition behind it does not stay a budget line for long, it becomes a fight about what counts as success once the money is spent. If one part of a CMO's team believes AEO spend should be judged on featured-snippet capture and another believes it should be judged on ChatGPT citation rate, both are defensible readings of the same term, and a review meeting six months out has no shared basis for agreement. Mike King's Relevance Engineering framework, covered in <a href="/bg-045.html">BG-045</a>, exists partly as a response to this exact problem, treating the discipline as the intersection of retrieval, content strategy, UX, embeddings, digital PR and measurement rather than a single tactic with a single metric attached. Whether or not a team adopts that specific framework, the underlying point holds: 94% budget intent aimed at an undefined target is a bigger risk than 60% budget intent aimed at a defined one.</p>

  <h2>A definition a CMO's team could actually align on</h2>
  <p>Before spending against this budget line, three questions are worth forcing agreement on, in writing, rather than assuming everyone already agrees. First, which surfaces count: does this budget's "AEO" include traditional featured snippets and voice assistants, or is it scoped specifically to generative AI chat and AI Overview answers? Second, what counts as a citation: a brand named in passing prose, a brand in a numbered list, or a brand with a linked source attached are different outcomes, and a team should decide which ones it is actually paying to move. Third, what the success metric is: citation rate, sentiment, factual accuracy of what is said, or downstream conversion from an AI-referred visit, since Adobe's own retail data shows AI-referred visitors already convert 54% better than other traffic, a genuinely different metric than simply being mentioned. A team that answers those three questions before the budget is spent has a shared definition. A team that does not will have 94% intent and no way to tell, come year end, whether any of it worked.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Budget intent and definitional clarity are two different things, and this year the first is running well ahead of the second. Ninety-four percent planning to spend more is a real signal about market-wide budget direction. It says nothing about whether the team spending that budget has agreed on what AEO is actually supposed to buy, and that agreement is the cheaper problem to fix first.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-103
ARTICLES.append(dict(
    slug="bg-103", bid="BG-103", date="2026-08-14", date_label="August 14, 2026", read=7,
    tags=["How To", "AI Accuracy", "Brand Risk"],
    title="How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately",
    h1="How to Check Whether ChatGPT, Gemini and Claude <em>Describe Your Brand Accurately</em>",
    h1_plain="How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately",
    subtitle="Being mentioned and being described correctly are different outcomes. A short, practical method for catching the second failure, the one most self-audits skip entirely.",
    meta_desc="A practical method for checking whether ChatGPT, Gemini and Claude get your pricing, category and key facts right, not just whether they mention your brand.",
    og_desc="These models can name your company correctly and still be wrong about it. A step-by-step method for checking your pricing, category and key facts against what ChatGPT, Gemini and Claude actually say.",
    ld_desc="A practical, tool-free methodology for checking whether AI engines describe a brand's pricing, category and key facts accurately, distinct from checking whether the brand is mentioned or cited at all.",
    keywords="check brand description ai chatbots, is chatgpt describing my company correctly, ai hallucination brand facts, verify ai chatbot accuracy about my company, fact check ai brand description",
    about=["AI Accuracy", "Brand Risk", "Practical Methodology", "Generative Engine Optimization"],
    findings=[("2", "questions to ask every engine directly: what does this company do, and what does it cost"),
              ("51%", "of AI answers to news questions found to have significant issues, per the BBC's own February 2025 study, a baseline risk any brand should assume applies to it too"),
              ("19%", "of AI answers citing BBC content that introduced factual errors not present in the original reporting"),
              ("$150,000", "the size of a real contract canceled after an AI Overview falsely linked a company to a lawsuit it was never part of")],
    faq=[("What is the difference between checking visibility and checking accuracy?",
          "Visibility asks whether and how often you show up. Accuracy asks whether what is said about you, once you do show up, is actually true. BG-053 covers the broader visibility self-audit, mention frequency, citation, sentiment, consistency across runs. This piece narrows to the accuracy check specifically, since a brand can pass every visibility check and still be described wrong."),
         ("What specific facts should I check?",
          "Four things: category (does the engine describe what you actually sell), pricing (is any stated price or plan current), founding facts and scale (founding year, headquarters, team size, anything stated as a specific checkable fact), and differentiators (does the description of what sets you apart match what you would actually claim, or is it generic)."),
         ("What if the AI has outdated information, like an old price or a discontinued product?",
          "That is a common and documented failure mode, not a rare glitch. It usually happens because the model's retrieval layer pulled a cached or superseded page, or because the underlying training data predates a change you made. Check it against your current site directly rather than assuming the model is working from up-to-date information."),
         ("What do I do if I find a factual error?",
          "There is no universal correction channel across engines. The more durable fix is upstream: state the correct fact clearly, in plain text, on the pages an engine is most likely to actually retrieve from, then recheck on a schedule rather than once. For anything approaching real reputational or financial harm, treat it as a more serious problem than a stale price.")],
    related=[("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The fuller self-audit method this piece narrows from visibility generally to factual accuracy specifically."),
             ("/bg-047.html", "BG-047", "What Happens When an AI Overview Accuses Your Company of Something It Never Did",
              "Two live lawsuits showing what an uncaught false AI claim can actually cost."),
             ("/bg-046.html", "BG-046", "The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing Three Times Out of Ten",
              "The BBC's own measured accuracy-issue rate, the baseline risk this piece's method exists to check.")],
    cta_h="Check the facts, not just the mentions",
    cta_p="Our free audit shows what each engine currently says about your brand, on screen, so you can check it against your own site yourself. No signup and no card.",
    body="""  <p>Ask ChatGPT what your company does and it will almost always answer with something. Whether that something is true is a separate question, and it is the one most brand-visibility checks skip entirely. <a href="/bg-053.html">BG-053 covers the broader self-audit method</a>, mention frequency, citation, sentiment, run-to-run consistency. This piece narrows to one specific failure mode inside that method: the AI mentions you, confidently, and gets a fact wrong.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a practical methodology piece, not new data collection. The baseline accuracy-risk figures below trace to <a href="/bg-046.html">BG-046's coverage of the BBC's own published news-accuracy studies</a> and <a href="/bg-047.html">BG-047's coverage of two live lawsuits over false AI claims</a>, both already sourced on this site to named studies and named legal filings. Current as of 13 August 2026.</p>
  </div>

  <h2>Why mention-without-accuracy is a distinct, documented failure mode</h2>
  <p>These models can name a real company correctly and still be wrong about it, and this is not a hypothetical. The BBC's own testing of AI answers against its own news reporting found 51% of answers had significant issues in its first study, improving to 45% in a larger follow-up with the European Broadcasting Union, and 19% of answers that specifically cited BBC content introduced factual errors not present in the original story. That is the measured error rate from one of the most heavily resourced, best-documented newsrooms in the world. A brand with a thinner public footprint has no particular reason to assume its own baseline is safer. At the severe end, <a href="/bg-047.html">two live lawsuits</a>, Wolf River Electric v. Google and Ashley MacIsaac v. Google, involve AI Overviews making specific, checkable false claims about real people and companies, with a canceled $150,000 contract and a canceled concert as documented consequences. Most accuracy failures are smaller than that, an outdated price, a discontinued product described as current, a founding year off by a few years, but the mechanism is the same: information is stated confidently and is wrong.</p>

  <h2>The four facts worth checking every time</h2>
  <p>Ask each engine directly, in a fresh conversation with no prior context: what does [Company] do, and what does [Company] cost. Then check the answer against four things, in this order.</p>

  <ul>
    <li><strong>Category.</strong> Does the engine correctly describe what your company actually sells or does, not an adjacent or outdated category?</li>
    <li><strong>Pricing.</strong> If the engine states a price, tier, or plan name, is it current? Pricing pages change more often than most other public-facing content, and a model working from stale training data or a cached page can easily surface an old number confidently.</li>
    <li><strong>Founding facts and scale.</strong> Founding year, headquarters, team size, funding, anything stated as a specific fact rather than a general description is checkable against your own about page, and worth checking rather than assumed close enough.</li>
    <li><strong>Differentiators.</strong> Does the description of what sets you apart match what you would actually claim, or is it a generic paragraph that could apply to three competitors equally? A generic-but-accurate description is a weaker failure than a specific-but-wrong one, but both are worth logging.</li>
  </ul>

  <h2>Repeat it, because a single answer proves less than it looks like</h2>
  <p>The same consistency problem that applies to visibility checks applies here. An engine that states your pricing correctly once and incorrectly the next time is not contradicting itself randomly, it is showing that its answer depends on what it retrieved that specific run. Running the two questions above across ChatGPT, Gemini and Claude, on two or three separate days, tells you whether an error is a one-off retrieval miss or a persistent, repeatable misdescription. A persistent one is the more urgent problem, since it means whatever source the model keeps pulling from is itself wrong, outdated, or missing, worth tracking down and fixing at the source.</p>

  <h2>What to do with a confirmed error</h2>
  <p>There is no reliable, universal report-this-inaccuracy channel across ChatGPT, Gemini and Claude the way there is a correction process with a newsroom. The more durable fix is upstream: make sure the correct fact is stated clearly, in plain text rather than only in an image or a PDF, on the pages these engines are most likely to actually retrieve from, your own site first, then any third-party listing that might be the model's actual source. Then recheck on a schedule rather than once, since a fix that has not propagated into a model's retrieval yet looks identical to a fix that never worked. For anything approaching the severity of the two lawsuits above, treat it as a different tier of problem than a stale price.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A brand mentioned everywhere and described wrong somewhere is not ahead of a brand that is invisible, it is carrying a different, harder-to-notice risk. Checking for a mention is the easy half of a self-audit. Checking whether what is said is actually true is the half that catches the failure mode with real consequences attached.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-104
ARTICLES.append(dict(
    slug="bg-104", bid="BG-104", date="2026-08-14", date_label="August 14, 2026", read=8,
    tags=["Definitions", "AI Citation Research", "Foundational Concepts"],
    title="What 'Citation' Actually Means to an AI Model, and Why It Is Not the Same as a Link",
    h1="What <em>'Citation' Actually Means</em> to an AI Model, and Why It Is Not the Same as a Link",
    h1_plain="What 'Citation' Actually Means to an AI Model, and Why It Is Not the Same as a Link",
    subtitle="A backlink is a persistent, crawlable HTML anchor. An AI citation is usually a runtime retrieval event that may not repeat tomorrow. Conflating the two is why treating citations like backlinks is bad advice.",
    meta_desc="Why an AI citation is not a backlink: usually a runtime retrieval event, transient and per query, not a persistent, crawlable link you can build once.",
    og_desc="A backlink sits on a page until someone changes it. An AI citation is regenerated at answer time and may not repeat tomorrow, a difference that changes what building citations should mean.",
    ld_desc="An explainer distinguishing an AI citation, a transient per-query retrieval event, from a traditional SEO backlink, a persistent indexed anchor, and what that means for GEO strategy.",
    keywords="ai citation vs backlink definition, what is a citation in ai search, ai citation meaning, difference between backlink and ai citation, generative engine optimization terminology",
    about=["AI Citation Research", "Generative Engine Optimization", "Foundational Concepts", "Methodology Transparency"],
    findings=[("0", "guarantee that an AI citation earned today appears again tomorrow, since most engines retrieve fresh per query rather than storing a fixed reference"),
              ("96%, 82%, 55%", "citation frequency for ChatGPT, Gemini and Claude respectively, per Muck Rack, three retrieval mechanics producing three different rates"),
              ("<1 in 1,000", "chance an AI platform returns the same brand list in the same order twice for an identical prompt, per SparkToro, a sign of how unstable one citation event is"),
              ("84%", "of all AI citations traced to earned third-party media rather than a brand's own site, per Muck Rack's 25-million-link study")],
    faq=[("Is an AI citation the same as a backlink?",
          "No. A backlink is a persistent HTML anchor tag sitting on a page, crawlable and indexed until someone changes it. An AI citation is usually a runtime retrieval-and-attribution event: the model's search layer pulled a source at answer-generation time and displayed it, which is transient and specific to that one answer."),
         ("Can I build AI citations the way I build backlinks, through outreach?",
          "Not durably, no. Outreach can make your content more likely to be the kind of thing a retrieval layer keeps pulling, but there is no equivalent action to placing a link on a page that then stays there. Being cited today does not create a stored, repeatable reference the way a crawled backlink does."),
         ("Does an AI citation pass any SEO value the way a backlink does?",
          "Not in the same sense. Some citations are technically clickable links pointing at a real URL, but the specific instance of being shown as a citation in one answer is not indexed and does not accumulate into a standing profile the way a backlink relationship does in a link graph. It is regenerated at answer time, not stored."),
         ("So what should I actually do instead of chasing individual citations?",
          "Focus on what the disclosed research shows correlates with being pulled repeatedly: genuine third-party coverage over paid placement, since earned media accounts for 84% of citations and paid content is almost never cited, and content that stays reasonably current rather than aging untouched.")],
    related=[("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
              "The four engines' retrieval mechanics in full, the source for how differently each one produces a citation."),
             ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
              "The disclosed studies behind the correlation and freshness figures this piece cites."),
             ("/bg-053.html", "BG-053", "How to Read Your Own Brand's AI Answers Like an Auditor",
              "The self-audit method that treats one observed citation as a data point, not a settled fact.")],
    cta_h="See what a citation actually looks like, for you",
    cta_p="One retrieval pass, right now, across the engines this piece describes. What you see is one run, not a guarantee, exactly the point made above. No signup and no card.",
    body="""  <p>This site uses the word "citation" in nearly every piece it publishes, usually without pausing to say what it actually means. That is worth fixing, because the word is borrowed from a much older, much better understood concept, the SEO backlink, and the two are not the same thing wearing different clothes. Understanding exactly how they differ changes what "getting cited by AI" should mean as a goal in the first place.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a definitional piece, not new data collection. The retrieval-mechanics descriptions below trace to <a href="/bg-044.html">BG-044's engine-by-engine breakdown</a> of how ChatGPT, Gemini, Perplexity and Claude actually pick sources, and the correlation figures trace to <a href="/bg-035.html">BG-035's map of the disclosed 2026 citation-research studies</a>, both already sourced on this site. Current as of 13 August 2026.</p>
  </div>

  <h2>What a backlink actually is</h2>
  <p>A traditional SEO backlink is concrete and durable. It is a persistent HTML anchor tag sitting on a specific page, crawlable by a search engine's own bots, indexed, and counted as part of that page's link profile until somebody edits the page or the link goes dead. It exists whether or not anyone is currently searching for anything. A crawler finds it on its own schedule, adds it to a graph, and that graph is the thing PageRank and its many descendants were built to read. A backlink earned in March is still there in August unless something changes it.</p>

  <h2>What an AI citation actually is</h2>
  <p>An AI citation, the source card or inline reference attached to a ChatGPT, Perplexity, or Gemini answer, is usually something structurally different: a runtime retrieval-and-attribution event. When the model's search or retrieval layer runs, it queries live or recently indexed sources, selects some subset to read, generates an answer, and attaches a citation to whichever sources it actually drew from for that specific response. <a href="/bg-044.html">BG-044 documents how differently this works engine to engine</a>: Perplexity's own described method searches an index of over 200 billion URLs per query and runs a three-layer reranking pipeline before citing; Claude's web search is a server tool that queries Brave Search and, in its newest tool version, can filter results before they enter the model's context; Gemini's grounding runs as a metered, billed-per-query search call. The mechanics behind how a query reaches an answer at all, the retrieval pipeline itself, are covered in more detail in BG-056. None of these produce a standing, indexed relationship the way a crawled backlink does. They produce one answer's worth of attribution, generated fresh, that may or may not repeat the next time the identical question is asked.</p>

  <h2>Why "the next time" is the load-bearing phrase</h2>
  <p>This is the part that makes the backlink comparison actively misleading rather than just imprecise. SparkToro's study of 2,961 queries across three major AI platforms found less than a 1-in-100 chance the same platform returns the same list of brand recommendations for an identical question asked twice, and roughly a 1-in-1,000 chance the list comes back in the same order. A citation earned in one run is not a guarantee of the same citation on the next run, even with nothing else changed, because the retrieval layer is querying fresh sources each time rather than consulting a fixed reference it stored from before. Muck Rack's disclosed citation-frequency numbers show how much this varies even at the aggregate level: ChatGPT cites a source in 96% of its responses, Gemini in 82%, Claude in just 55%, three different retrieval architectures producing three different baseline rates before any question of consistency between runs even enters the picture.</p>

  <h2>Why "building citations" does not work the way "building backlinks" did</h2>
  <p>Backlink building, whatever its ethics, always rested on a real mechanical fact: place a link on a page, and it stays there, crawlable, until someone removes it. That is what made outreach, guest posts, and digital PR a durable investment; the asset persisted after the campaign ended. An AI citation does not offer that same durability, because there is no equivalent standing asset to place. You cannot put a citation directly onto a page the way you place a backlink; you can only make your content the kind of thing a retrieval layer is likely to keep pulling, and even then, being pulled today does not create a stored, repeatable reference. Muck Rack's 25-million-link study found 84% of all AI citations trace to earned third-party media rather than a brand's own site, which is a related but separate point: it says where citations tend to come from, not that any single earned citation, once it happens, becomes permanent. The gap between merely being mentioned in an answer and actually being cited with a source attached, a distinct and important difference in its own right, is covered separately in BG-076.</p>

  <h2>What actually holds up instead of a single citation</h2>
  <p>If a citation itself is not the durable asset, what is? The disclosed research points toward being the kind of source a retrieval layer keeps finding worth pulling, repeatedly, across many separate runs, rather than any one placement. That means genuine third-party coverage over paid placement, since paid and advertorial content is essentially never cited. It means content that stays reasonably current rather than aging untouched, since the freshness research this site has covered found sustained citation tracks moderate, ongoing freshness rather than a single publish date. And it means treating a citation observed today as a data point in a trend, the same discipline this site's own self-audit method applies, rather than as a placement that can be checked off and considered secured.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A backlink is a thing that exists on the web whether or not anyone is looking. An AI citation is closer to an observation made at the moment someone asked a question, one that a different question, a different day, or a different retrieval pass can produce differently. Calling both "citations" and treating them the same way is one of the most common category errors in how this field talks about itself, worth naming precisely once rather than leaving implicit in every other article that uses the word.</p>
  </div>""",
))
