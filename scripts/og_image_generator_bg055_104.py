from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

WEB = r"C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web"
W, H = 1149, 1369
BG = (8, 8, 15)
CARD = (17, 17, 28)
WHITE = (255, 255, 255)
GRAY = (255, 255, 255, 165)
GRAY2 = (255, 255, 255, 110)
TEAL = (0, 212, 170)
VIOLET = (139, 92, 246)
GRAD_A = (59, 130, 246)
GRAD_B = (139, 92, 246)

FB = r"C:\Windows\Fonts\segoeuib.ttf"
FR = r"C:\Windows\Fonts\segoeui.ttf"
def f(sz, bold=True): return ImageFont.truetype(FB if bold else FR, sz)

def grad_text(draw_img, xy, text, font, c1, c2):
    x, y = xy
    tmp = Image.new("L", draw_img.size, 0)
    ImageDraw.Draw(tmp).text((x, y), text, font=font, fill=255)
    bbox = ImageDraw.Draw(tmp).textbbox((x, y), text, font=font)
    grad = Image.new("RGB", draw_img.size, c1)
    gd = ImageDraw.Draw(grad)
    x0, x1 = int(bbox[0]), int(max(bbox[2], bbox[0]+1))
    for i in range(x0, x1):
        t = (i - x0) / (x1 - x0)
        col = tuple(int(c1[k] + (c2[k]-c1[k])*t) for k in range(3))
        gd.line([(i, bbox[1]), (i, bbox[3])], fill=col)
    draw_img.paste(grad, (0, 0), tmp)
    return bbox

def make(fname, kicker, lines, sub, stats, footer_note):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img, "RGBA")

    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-350, -350, 600, 600], fill=(30, 22, 60))
    gd.ellipse([W-500, H-450, W+350, H+350], fill=(8, 38, 34))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    img = Image.blend(img, glow, 0.9)
    d = ImageDraw.Draw(img, "RGBA")

    logo = Image.open(os.path.join(WEB, "logo.png")).convert("RGBA")
    lh = 74; lw = int(logo.width * lh / logo.height)
    logo_r = logo.resize((lw, lh), Image.LANCZOS)
    img.paste(logo_r, (60, 52), logo_r)
    fx = 60 + lw + 18
    fw = f(52)
    d.text((fx, 58), "Brand", font=fw, fill=WHITE)
    bw = d.textlength("Brand", font=fw)
    grad_text(img, (int(fx + bw), 58), "GEO", fw, GRAD_A, GRAD_B)
    d = ImageDraw.Draw(img, "RGBA")
    d.text((fx, 118), "The AI Visibility Platform", font=f(26, False), fill=GRAY)

    badge = "BrandGEO Research\u2122"
    bf = f(24)
    btw = d.textlength(badge, font=bf)
    bx1, by1 = W - 60 - btw - 44, 66
    d.rounded_rectangle([bx1, by1, W-60, by1+52], radius=26, outline=(0,212,170,90), width=2, fill=(0,212,170,22))
    d.text((bx1+22, by1+12), badge, font=bf, fill=TEAL)

    y = 240
    d.text((62, y), kicker.upper(), font=f(28), fill=TEAL)
    y += 66

    hf = f(76)
    for line in lines:
        x = 60
        for seg, style in line:
            if style == 'g':
                grad_text(img, (int(x), y), seg, hf, GRAD_A, GRAD_B)
                d = ImageDraw.Draw(img, "RGBA")
            else:
                d.text((x, y), seg, font=hf, fill=WHITE)
            x += d.textlength(seg, font=hf)
        y += 92
    y += 26

    for s in sub:
        d.text((62, y), s, font=f(30, False), fill=GRAY)
        y += 44

    top = y + 40
    gap = 24
    cw = (W - 120 - gap) // 2
    ch = 190
    for i, (num, label, src) in enumerate(stats):
        cx = 60 + (i % 2) * (cw + gap)
        cy = top + (i // 2) * (ch + gap)
        d.rounded_rectangle([cx, cy, cx+cw, cy+ch], radius=18, fill=(17,17,28,255), outline=(255,255,255,26), width=2)
        col = TEAL if i % 2 == 0 else VIOLET
        nf = f(58)
        while d.textlength(num, font=nf) > cw - 56 and nf.size > 28:
            nf = f(nf.size - 2)
        d.text((cx+28, cy+22), num, font=nf, fill=col)
        lf = f(23)
        while d.textlength(label, font=lf) > cw - 56 and lf.size > 16:
            lf = f(lf.size - 1)
        d.text((cx+28, cy+100), label, font=lf, fill=WHITE)
        sf = f(19, False)
        while d.textlength(src, font=sf) > cw - 56 and sf.size > 14:
            sf = f(sf.size - 1)
        d.text((cx+28, cy+140), src, font=sf, fill=GRAY2)

    pills = ["Measure AI Visibility", "Track Citations", "Analyze Competitors", "Optimize AI Presence"]
    psz = 24
    while True:
        pf = f(psz)
        total = sum(d.textlength(p, font=pf) + 44 for p in pills) + 16*(len(pills)-1)
        if total <= W - 120 or psz <= 16:
            break
        psz -= 1
    py = H - 200
    px = (W - total) / 2
    for p in pills:
        pw2 = d.textlength(p, font=pf) + 44
        d.rounded_rectangle([px, py, px+pw2, py+52], radius=26, fill=(17,17,28,255), outline=(255,255,255,26), width=2)
        d.text((px+22, py+13), p, font=pf, fill=GRAY)
        px += pw2 + 16

    fy = H - 92
    d.line([(60, fy), (W-60, fy)], fill=(255,255,255,30), width=2)
    d.text((60, fy+24), "getbrandgeo.com", font=f(30), fill=TEAL)
    note_w = d.textlength(footer_note, font=f(26, False))
    d.text((W-60-note_w, fy+28), footer_note, font=f(26, False), fill=GRAY)

    out = os.path.join(WEB, "images", "og", fname)
    img.save(out, "PNG")
    print("saved", out)


make("og-bg-055.png", "BG-055 · Platform Volatility",
    [[("ChatGPT Citations", 'w')], [("Crashed ", 'w'), ("86-94%", 'g')]],
    ["Citation volume fell 86-94% across five",
     "countries at once, then mostly recovered."],
    [("86-94%", "citation drop vs. Feb baseline across five markets", "seoClarity tracking, 2026"),
     ("157%", "surge in ChatGPT referral traffic in May", "After citations expanded on-page"),
     ("2", "unconfirmed causes: model default change, ad rollout", "Neither confirmed by OpenAI"),
     ("5", "markets tracked: US, UK, Canada, Germany, Italy", "seoClarity and Resoneo studies")],
    "Five Markets, One Pattern")

make("og-bg-056.png", "BG-056 · Retrieval Mechanics",
    [[("One Hidden Source,", 'w')], [("Handles ", 'w'), ("88%", 'g')]],
    ["Four internal sources power ChatGPT's",
     "citations. OpenAI has named none of them."],
    [("88.1%", "of logged ChatGPT results traced to one retrieval source", "Named 'Labrador,' undocumented by OpenAI"),
     ("11.6%", "of repeated prompts switch their primary retrieval source", "Chris Green, 9,946 search runs"),
     ("9,946", "completed ChatGPT search runs analyzed across 1,000 prompts", "Independent reverse-engineering, 2026"),
     ("0", "of these source names OpenAI has itself published", "Search Engine Land, July 2026")],
    "Four Sources, Zero Disclosure")

make("og-bg-057.png", "BG-057 · Reasoning Modes",
    [[("Thinking Mode Cites", 'w')], [("Different ", 'w'), ("Brands", 'g')]],
    ["Same prompt, two modes, only 25.6%",
     "overlap in which domains got cited."],
    [("25.6%", "domain overlap between Thinking and Instant mode citations", "Semrush + Kevin Indig study"),
     ("50% to 68%", "citation rate rising from minimal to high reasoning", "Semrush + Kevin Indig study"),
     ("4.6x", "more web searches run per prompt in Thinking mode", "1,130 vs 245 searches per prompt"),
     ("28 pts", "largest citation-rate gap between modes, in finance", "Semrush + Kevin Indig study")],
    "Two Modes, One Brand")

make("og-bg-058.png", "BG-058 · Schema Markup",
    [[("Google Killed FAQ", 'w')], [("Rich Results, ", 'w'), ("Quietly", 'g')]],
    ["No announcement, just a docs-page edit.",
     "FAQ schema never reliably bought citation."],
    [("May 7, 2026", "date the FAQ rich results deprecation took effect", "Search Engine Journal"),
     ("3", "deprecation phases: SERP display, reporting, API support", "Google developer docs notice"),
     ("2023", "the year FAQ results were already restricted to a few sites", "Limited to gov and health sites since then"),
     ("0", "AI citation lift measured from JSON-LD schema alone", "Ahrefs matched-control test, BG-038")],
    "Feature Gone, Habit Stays")

make("og-bg-059.png", "BG-059 · Model Updates",
    [[("GPT-5.6 Landed.", 'w')], [("Citation Rules ", 'w'), ("Shifted", 'g')]],
    ["Three tiers, three different citation",
     "habits, per one early, unconfirmed read."],
    [("July 9, 2026", "OpenAI's own release date for the GPT-5.6 model family", "OpenAI, confirmed by TechCrunch"),
     ("3", "GPT-5.6 tiers reportedly showing different citation habits", "Topify analysis, unconfirmed"),
     ("300,000 tokens", "context point where the smallest tier stopped citing", "Topify, one early observation"),
     ("0", "OpenAI statements confirming a citation-behavior change", "No official methodology published")],
    "One Vendor's Early Read")

make("og-bg-060.png", "BG-060 · AI Search Trends",
    [[("Perplexity's Share", 'w')], [("Falls. ", 'w'), ("Comet Grows.", 'g')]],
    ["Referral share fell a third while Comet",
     "reportedly climbed the app charts."],
    [("11.4%", "Perplexity's share of US AI-search referral traffic, early 2026", "Industry referral-traffic tracking"),
     ("6.85%", "that same referral share, reported by mid-2026", "Industry referral-traffic tracking"),
     ("#3", "Comet's reported rank among free US iOS apps", "App-intelligence tracking, reported"),
     ("2", "different metrics, users and referral share, easily conflated", "Not the same number")],
    "Two Metrics, Not One")

make("og-bg-061.png", "BG-061 · AI Referral Traffic",
    [[("Claude's Traffic", 'w')], [("Spiked ", 'w'), ("320%", 'g')]],
    ["320% is the year, not the month.",
     "March alone reportedly spiked 159%."],
    [("320%", "Claude's reported year-over-year referral traffic growth", "Industry traffic-analytics tracking"),
     ("159%", "the reported single-month spike, March 2026", "Industry traffic-analytics tracking"),
     ("55%", "of Claude responses that include a source citation", "Muck Rack, 25M-link study"),
     ("96%", "ChatGPT's citation rate on the same disclosed study", "Muck Rack, 25M-link study")],
    "Most Under-Tracked Engine")

make("og-bg-062.png", "BG-062 · Free Tier Strategy",
    [[("Gemini Grew 231%.", 'w')], [("Nobody's ", 'w'), ("Watching", 'g')]],
    ["The 'boring default' reputation doesn't",
     "match its reported 231% traffic growth."],
    [("231%", "Gemini's reported year-over-year referral traffic growth", "Industry traffic-analytics tracking"),
     ("82%", "Gemini's citation rate, second only to ChatGPT's 96%", "Muck Rack, 25M-link study"),
     ("$14", "per 1,000 queries for grounded search, down from $35 flat", "Google grounding pricing, Jan 2026"),
     ("1", "engine BrandGEO's Free plan collects through today", "Gemini, by deliberate design")],
    "The Free Tier's Engine")

make("og-bg-063.png", "BG-063 · Agentic Commerce",
    [[("AI Browsers Crossed", 'w')], [("10 Million ", 'w'), ("Users", 'g')]],
    ["Agentic browsers don't just return links,",
     "they compare, add to cart, and check out."],
    [("10M+", "reported monthly active users across agentic AI browsers", "Industry-tracked, not independently audited"),
     ("UCP", "the Universal Commerce Protocol, an open agent-checkout standard", "Google and Shopify, announced Jan 2026"),
     ("Jan 8, 2026", "US launch date of Copilot Checkout, in-chat purchasing", "Microsoft, with PayPal and Stripe"),
     ("2", "separate surfaces this piece won't conflate: AI Mode, Overviews", "Answering and acting are different jobs")],
    "Getting Found vs Getting Picked")

make("og-bg-064.png", "BG-064 · Startup Postmortem",
    [[("A GEO Startup", 'w')], [("Shut Down. ", 'w'), ("Why?", 'g')]],
    ["One founder's postmortem, checked against",
     "what the disclosed GEO research supports."],
    [("~7", "months Lorelight reportedly operated before shutting down", "Founder's own public postmortem"),
     ("<1%", "chance the same AI platform repeats the same brand list", "SparkToro, 2,961 queries"),
     ("0", "citation lift Ahrefs' matched-control study found from schema alone", "Ahrefs matched-control study"),
     ("$300M+", "raised across six GEO-native startups in under two years", "Under two years, per BG-042")],
    "Some Signal, No Guarantee")

make("og-bg-065.png", "BG-065 · AI Crawlers",
    [[("Llms.txt Won't", 'w')], [("Get You Cited ", 'w'), ("Yet", 'g')]],
    ["Adoption sits near 9-16% of tracked sites,",
     "with no shown link to more AI citations."],
    [("9-16%", "of tracked sites reportedly have an llms.txt file", "Adoption trackers, 2026"),
     ("0", "matched-control studies show a citation lift from it", "Direct research, Aug 2026"),
     ("Undisclosed", "whether major AI crawlers fetch llms.txt at all", "No AI firm has confirmed it"),
     ("2024", "the year llms.txt was proposed as a standard", "Jeremy Howard, Answer.AI")],
    "No Shown Citation Lift")

make("og-bg-066.png", "BG-066 · AI Citation",
    [[("Backlinks vs Mentions:", 'w')], [("Still ", 'w'), ("Unsettled", 'g')]],
    ["Two disclosed studies measured it and",
     "didn't fully agree with each other."],
    [("Weak", "Ahrefs' correlation between backlink count and citation", "Ahrefs correlation study"),
     ("0.49", "correlation between referring domains and mention rate", "SEJ / Victorious study"),
     ("0", "studies isolated a direct vs indirect backlink effect", "Direct research, Aug 2026"),
     ("2", "disclosed studies exist on this question, and they disagree", "Direct research, Aug 2026")],
    "Two Studies, No Consensus")

make("og-bg-067.png", "BG-067 · GEO vs SEO",
    [[("GEO vs SEO:", 'w')], [("Still ", 'w'), ("Not Settled", 'g')]],
    ["\"Both required\" settles the vocabulary",
     "fight, not the budget and KPI one."],
    [("2+", "years this terminology debate has recurred, unresolved", "Direct research, Aug 2026"),
     ("3", "separate questions this debate collapses into one", "Direct research, Aug 2026"),
     ("8", "legacy SEO platforms checked, none built new AI infra", "BrandGEO Research, BG-040"),
     ("0", "pieces found that actually resolved the budget/KPI question", "Direct research, Aug 2026")],
    "Budget Fight Still Open")

make("og-bg-068.png", "BG-068 · Myth-Bust",
    [[("44% Lift, Vendors Claim.", 'w')], [("One Study Found ", 'w'), ("Nothing", 'g')]],
    ["A matched-control test of 1,885 pages",
     "found no significant citation lift."],
    [("0%", "significant lift Ahrefs measured from adding JSON-LD schema", "Ahrefs, 1,885-page test"),
     ("-4.6%", "change in AI Overviews citations after adding schema", "Ahrefs matched-control study"),
     ("~3x", "more likely a cited page already carries schema", "Ahrefs, 6M-URL pass"),
     ("Undisclosed", "sample size behind the vendor's 44% lift claim", "No named study found")],
    "Tested: No Citation Lift")

make("og-bg-069.png", "BG-069 · Content Strategy",
    [[("Evergreen Content Is", 'w')], [("Losing ", 'w'), ("AI Citations", 'g')]],
    ["Sustained citation tracks moderate",
     "freshness, not the newest page."],
    [("75%", "of cited pages were updated within the past year", "Seer Interactive"),
     ("72%", "of freshness signal comes from edits, not new posts", "Seer Interactive"),
     ("6 months", "median age of pages with sustained citation", "Seer Interactive"),
     ("78% vs 65%", "Gemini vs Perplexity freshness weighting", "Seer Interactive")],
    "Freshness Beats Novelty")

make("og-bg-070.png", "BG-070 · GEO Measurement",
    [[("GEO Can't Be", 'w')], [("Tracked With a ", 'w'), ("Pixel", 'g')]],
    ["A pixel needs a click. Most of what",
     "GEO influences never produces one."],
    [("68.01%", "of Google searches end with no click at all", "SparkToro panel study"),
     ("0", "UTM parameters a synthesized AI answer ever generates", "Direct research, Aug 2026"),
     ("4", "proxy metrics that survive the no-pixel problem", "Direct research, Aug 2026"),
     ("62-63%", "of ChatGPT referral clicks land on the homepage", "Similarweb")],
    "Four Metrics That Survive")

make("og-bg-071.png", "BG-071 · GEO Statistics",
    [[("The 40% FAQ Stat", 'w')], [("Has No ", 'w'), ("Source", 'g')]],
    ["A precise ChatGPT weighting number",
     "circulates with no study behind it."],
    [("40%", "claimed FAQ schema weighting in ChatGPT sourcing", "Repeated in vendor blogs, unsourced"),
     ("0", "named studies found behind that 40% figure", "Direct research, Aug 2026"),
     ("4+", "vendor blogs repeat the identical unsourced number", "Darkroom, Kime.ai, Wellows, Ai Boost"),
     ("1,885", "pages tested in a real matched-control study instead", "Ahrefs, via BG-038")],
    "Unsourced, Still Repeated")

make("og-bg-072.png", "BG-072 · Per-Engine Strategy",
    [[("Reddit Owns", 'w')], [("Perplexity, Not ", 'w'), ("Gemini", 'g')]],
    ["24% of Perplexity's citations trace",
     "to Reddit. Gemini's figure: 0.1%."],
    [("24%", "of Perplexity's citations trace to Reddit", "Tinuiti Q1 2026 report"),
     ("0.1%", "of Gemini's citations trace to Reddit", "Tinuiti Q1 2026 report"),
     (">5%", "of ChatGPT's citations trace to Reddit", "Tinuiti Q1 2026 report"),
     ("40.1%", "Reddit's share of LLM references overall", "Semrush, 150,000 citations")],
    "Not A Universal Lever")

make("og-bg-073.png", "BG-073 · Conversion Rate",
    [[("AI Traffic Converts", 'w')], [("Up to ", 'w'), ("23x Higher", 'g')]],
    ["Three reports, three multiples, one",
     "consistent direction: AI converts better."],
    [("23x", "conversion multiple Ahrefs found for AI-referred visitors", "Ahrefs, self-reported"),
     ("12.1%", "of signups came from just 0.5% of AI-referred traffic", "Ahrefs, self-reported"),
     ("4.4x", "conversion multiple Semrush found, a lower figure", "Semrush, 500+ topics"),
     ("54%", "conversion lift Adobe measured, its most rigorous figure", "Adobe, 1T+ tracked visits")],
    "Better Convert, Still Rare")

make("og-bg-074.png", "BG-074 · Web Analytics",
    [[("AI Referrals Grew", 'w')], [("527% ", 'g'), ("Year Over Year", 'w')]],
    ["Two measurements, one direction: real",
     "growth from a small base, mostly ChatGPT."],
    [("527%", "year-over-year growth in AI-sourced website sessions", "Previsible / Superprompt report"),
     ("9.9x", "growth in monthly LLM-referred sessions over 19 months", "Previsible, 2026 report"),
     ("92.4%", "of all trackable LLM referral sessions are ChatGPT's", "Previsible, 2026 report"),
     ("64x", "Claude's session growth, the fastest of any engine", "Previsible, 2026 report")],
    "Growing Fast, Still Small")

make("og-bg-075.png", "BG-075 · Citation Signals",
    [[("Brand Mentions", 'w')], [("Beat ", 'w'), ("Backlinks", 'g')]],
    ["Ahrefs tested both signals across 75,000",
     "brands. Mentions won by a wide margin."],
    [("0.664", "correlation between branded mentions and ChatGPT citation", "Ahrefs, 75,000 brands"),
     ("Weak", "backlink correlation with citation, across all three engines", "Ahrefs correlation study"),
     ("75,000", "brands in Ahrefs' study, filtered by Domain Rating above 40", "Ahrefs, Dec 2025"),
     ("0.49", "correlation for referring domains, a smaller study", "SEJ & Victorious, 175 brands")],
    "Mentions Beat Backlinks")

make("og-bg-076.png", "BG-076 · Citation Gap",
    [[("A Mention Is", 'w')], [("Not A ", 'w'), ("Citation", 'g')]],
    ["Being named and being sourced",
     "are two different events, rarely both."],
    [("~28%", "answers with both a mention and a citation, unverified", "Unverified, no disclosed source"),
     ("99.99%", "of logged citations pointed to third-party domains", "SEJ & Victorious study"),
     ("4 of 150", "brands earned any self-citation in category answers", "SEJ & Victorious study"),
     ("55%", "of Claude responses cite a source, vs 96% for ChatGPT", "Muck Rack, May 2026")],
    "Two Signals, One Gap")

make("og-bg-077.png", "BG-077 · Click-Through Data",
    [[("Clicks Down", 'w')], [("Nearly ", 'w'), ("60%", 'g')]],
    ["Two disclosed studies agree on the drop.",
     "Whether citation offsets it is unproven."],
    [("58%", "click-through drop on the #1 organic spot, up from 34.5%", "Similarweb-based tracking"),
     ("Nearly 60%", "click-through reduction SparkToro ties to AI Overviews", "SparkToro, Jan-Apr 2026"),
     ("68.01%", "of Google searches ended with no click at all", "SparkToro panel data"),
     ("Unverified", "claim that citation keeps 35% more of the remaining clicks", "No disclosed source found")],
    "Real Drop, Unproven Fix")

make("og-bg-078.png", "BG-078 · Market Sizing",
    [[("Three Reports,", 'w')], [("36% ", 'w'), ("Apart", 'g')]],
    ["No two market-size estimates for GEO",
     "agree, and none disclose their method."],
    [("36%", "spread between the highest and lowest 2026 GEO estimates", "Direct research, Aug 2026"),
     ("$1,089.3M", "Dimension Market Research's 2026 global GEO estimate", "Dimension Market Research"),
     ("$1.48B", "a separate report's 2026 figure, to $17.02B by 2034", "Separate market report"),
     ("$848M", "a third report's 2025 base year, to $19.8B by 2034", "Separate market report")],
    "Three Reports, No Agreement")

make("og-bg-079.png", "BG-079 · Owned Vs Earned",
    [[("86% Owned.", 'w')], [("84% ", 'w'), ("Earned.", 'g')]],
    ["Two disclosed studies measured the same",
     "question and reached opposite answers."],
    [("86%", "of 6.8M citations traced to brand-controlled sources", "Yext study"),
     ("84%", "of citations Muck Rack attributes to earned media", "Muck Rack, 25M+ links"),
     ("99.99%", "of citations pointed to third-party domains, not the brand", "SEJ & Victorious study"),
     ("42%", "of Yext's owned citations came from business listings", "Yext study")],
    "Two Studies, Opposite Answers")

make("og-bg-080.png", "BG-080 · Content Calendar",
    [[("90 Days,", 'w')], [("3 ", 'w'), ("Phases", 'g')]],
    ["Audit, earn citations, then re-measure.",
     "A dated plan, not another checklist."],
    [("30", "days budgeted for audit and fixes before new content starts", "Direct research, Aug 2026"),
     ("84%", "of AI citations trace to earned media, not owned content", "Muck Rack, cited in BG-035"),
     ("<1 in 100", "chance a single measurement run repeats itself", "SparkToro, cited in BG-037"),
     ("3", "phases, each with a stated exit condition", "Direct research, Aug 2026")],
    "A Calendar, Not A Checklist")

make("og-bg-081.png", "BG-081 · Quick Method",
    [[("10 Minutes,", 'w')], [("4 ", 'w'), ("Engines", 'g')]],
    ["No tool, no signup. Just four tabs",
     "and the prompts a buyer would type."],
    [("3 to 5", "prompts to run, the questions a real buyer would type", "Direct research, Aug 2026"),
     ("4", "engines to check: ChatGPT, Gemini, Claude, Perplexity", "Direct research, Aug 2026"),
     ("<1 in 100", "chance a repeat run returns the same list", "SparkToro, cited in BG-037"),
     ("0", "signup, card, or tool needed to run this once", "Direct research, Aug 2026")],
    "A Spot Check, Not A Trend")

make("og-bg-082.png", "BG-082 · Academic Study",
    [[("9 Techniques,", 'w')], [("5 ", 'w'), ("Worked", 'g')]],
    ["The paper that founded GEO, read",
     "closely instead of cited in passing."],
    [("9", "content techniques tested against a purpose-built benchmark", "Princeton/Georgia Tech paper"),
     ("5", "techniques that produced a real, measurable gain", "GEO-bench results"),
     ("41%", "largest single lift recorded, from Statistics Addition", "GEO-bench results"),
     ("9,106+", "times the paper had been downloaded as of March 2026", "Paper's own tracked count")],
    "Five Worked, Four Didn't")

make("og-bg-083.png", "BG-083 · Agentic Commerce",
    [[("Before An Agent", 'w')], [("Can ", 'w'), ("Recommend It", 'g')]],
    ["Price, availability and specs an agent",
     "can parse without guessing at all."],
    [("Jan 2026", "when the Universal Commerce Protocol was announced", "Google & Shopify"),
     ("Jan 8, 2026", "when Copilot Checkout launched across Copilot, Bing, Edge", "Microsoft"),
     ("0", "credit an agent gives data trapped in an image or unrun script", "Direct research, Aug 2026"),
     ("2", "separate layers a product must clear: discovery, checkout", "Direct research, Aug 2026")],
    "Discovery Isn't Checkout")

make("og-bg-084.png", "BG-084 · Budget Pitch",
    [[("The Budget Pitch", 'w')], [("With ", 'w'), ("No ROI", 'g')]],
    ["Compare GEO spend to PR and brand",
     "budgets already funded on judgment."],
    [("22 points", "how far B2B buyers starting in a chatbot moved in a year", "G2, cited in BG-051"),
     ("94%", "of CMOs who plan to increase AEO investment in 2026", "Conductor, vendor-sponsored"),
     ("3", "leading indicators to report instead of one ROI number", "Direct research, Aug 2026"),
     ("1", "slide, the size of ask this framework is built to fit", "Direct research, Aug 2026")],
    "The Case Without ROI")

make("og-bg-085.png", "BG-085 · Local Search",
    [[("Your GBP Wasn't Built", 'w')], [("For ", 'w'), ("AI Overviews", 'g')]],
    ["Most GBP advice was written for Maps.",
     "AI Overviews and AI Mode read it differently."],
    [("42%", "of AI citations trace to business listings", "Yext, 6.8M-citation study"),
     ("5", "structural changes to AI Overviews, May 2026", "Disclosed by Google"),
     ("Undisclosed", "GBP's exact weight in an AI Overview answer", "No public Google formula"),
     ("1B+", "monthly AI Mode users as of May 2026", "Disclosed by Google, I/O")],
    "Beyond The Maps Pin")

make("og-bg-086.png", "BG-086 · Earned Media",
    [[("What Actually Moves", 'w')], [("The ", 'w'), ("Citation Needle", 'g')]],
    ["Why a journalist's word counts more",
     "than your own marketing copy does."],
    [("84%", "of AI citations trace to earned media", "Muck Rack, 25M+ links"),
     ("99.99%", "of logged citations pointed to third-party domains", "SE Journal / Victorious"),
     ("25-27%", "of citations trace to journalism specifically", "Muck Rack, 3 editions"),
     ("0.3%", "citation share for paid or advertorial content", "Muck Rack Research")],
    "Earned Beats Owned")

make("og-bg-087.png", "BG-087 · Pre-Publish",
    [[("Six Checks Before", 'w')], [("You ", 'w'), ("Hit Publish", 'g')]],
    ["Six checks on one page, right before",
     "it goes live. Not a strategy, just a pass."],
    [("6", "items checked once, right before it goes live", "This checklist"),
     ("41%", "largest lift found for adding real statistics", "Founding GEO academic study"),
     ("43%", "lift found for adding direct quotations", "Same founding study"),
     ("0", "guarantee any single item carries on its own", "No promise of citation")],
    "Six Items, Checked Once")

make("og-bg-088.png", "BG-088 · Vendor Comparison",
    [[("Profound vs Peec", 'w')], [("vs ", 'w'), ("Otterly", 'g')]],
    ["Three vendors, three very different",
     "budgets. One side-by-side roundup."],
    [("$99", "Profound's published Starter monthly price", "Vendor-disclosed"),
     ("$95", "Peec AI's published Starter monthly price", "Vendor-disclosed"),
     ("$29", "Otterly's Lite price before engine add-ons", "Vendor-disclosed"),
     ("$1B", "Profound's valuation at its Feb 2026 Series C", "Funding announcements")],
    "Three Vendors Compared")

make("og-bg-089.png", "BG-089 · Pricing",
    [[("The Real Cost of", 'w')], [("Starting ", 'w'), ("At Dollar X", 'g')]],
    ["A headline price and the real bill",
     "rarely match. Ask before you sign."],
    [("4", "questions worth asking before you buy", "Beyond the headline price"),
     ("8x", "more some vendors charge to check Claude", "Aug 2026 pricing pass"),
     ("20-30%", "overage rate once your allotment is exceeded", "Same pricing pass"),
     ("$1,000-5,000", "onboarding fees absent from public pricing pages", "Same pricing pass")],
    "Four Questions To Ask")

make("og-bg-090.png", "BG-090 · Emerging Vendors",
    [[("Six GEO Startups", 'w')], [("You ", 'w'), ("Haven't Heard Of", 'g')]],
    ["The famous names get the attention.",
     "These six rarely make the shortlist."],
    [("6", "vendors profiled, none with a dedicated page here", "Direct research, Aug 2026"),
     ("$19.95", "Waikay's monthly entry price, the cheapest found", "Vendor-disclosed"),
     ("$68M", "raised by Bluefish AI, whose pricing page 404s", "Funding announcements"),
     ("3", "of six publish no standalone AI-feature price", "Direct research, Aug 2026")],
    "Beyond The Big Names")

make("og-bg-091.png", "BG-091 · Agency Reselling",
    [[("Agencies Are Reselling", 'w')], [("AI ", 'w'), ("Visibility Checks", 'g')]],
    ["Some agencies resell a real tool.",
     "Others just dress up a manual check."],
    [("$245", "Peec AI's entry-level Agency plan, monthly", "Vendor-disclosed"),
     ("$795", "Peec AI's top named Agency tier, monthly", "Vendor-disclosed"),
     ("1-in-100", "chance the same platform repeats a brand list", "SparkToro study"),
     ("4", "questions that expose a real method vs a one-off", "This research")],
    "Ask Before You Sign")

make("og-bg-092.png", "BG-092 · Enterprise Pricing",
    [[("What a Six-Figure", 'w')], [("Contract ", 'w'), ("Actually Buys", 'g')]],
    ["Some GEO deals run into six figures",
     "a year. Here's what that buys you."],
    [("$100,000 to $500,000+", "estimated annual range for Bluefish AI contracts", "Independent reviews"),
     ("$36,000", "annual contract minimum reported for Evertune", "Independent review"),
     ("$2,000 to $5,000+", "a month estimated for Profound's Enterprise tier", "Third-party reviews"),
     ("0", "of three vendors publish a flat enterprise price", "Direct research, Aug 2026")],
    "Three Vendors Examined")

make("og-bg-093.png", "BG-093 · Small Business",
    [[("Choosing A Tool", 'w')], [("On A ", 'w'), ("Small Budget", 'g')]],
    ["Under $100 a month, the decision",
     "is about coverage, not a roundup."],
    [("$19.95", "Waikay's monthly entry price, the cheapest shown", "Vendor-disclosed"),
     ("$29", "Otterly's Lite plan includes only 4 engines", "Vendor-disclosed"),
     ("EUR 29", "BrandGEO's own Radar plan, one entry point", "One example among several"),
     ("1", "engine (Gemini) on BrandGEO's ongoing free plan", "Not a time-boxed trial")],
    "Check Coverage First")

make("og-bg-094.png", "BG-094 · Free vs Paid",
    [[("Free Audit vs", 'w')], [("Paid ", 'w'), ("Monitoring", 'g')]],
    ["A free audit answers am I visible.",
     "Paid monitoring answers did it work."],
    [("1-in-100", "chance the same platform repeats a brand list", "SparkToro study"),
     ("1", "reading is what a free audit gives you", "A baseline, not a trend"),
     ("2", "readings, at minimum, before it's a real trend", "Not a single snapshot"),
     ("$19.95", "lowest monthly price shown for ongoing monitoring", "Vs $0 for a one-time audit")],
    "Snapshot vs Trend")

make("og-bg-095.png", "BG-095 · B2B Buyer Shift",
    [[("B2B Research", 'w')], [("Starts ", 'w'), ("in AI Chat", 'g')]],
    ["51% now start in a chatbot, not Google.",
     "That changes what top-of-funnel content is."],
    [("51%", "of B2B buyers now start research in an AI chatbot", "G2 2026 AI Search Insight"),
     ("71%", "who rely on AI chatbots for software research", "G2 2026 AI Search Insight"),
     ("89%", "of brands never appear in AI category answers", "SE Journal / Victorious"),
     ("84%", "of AI citations trace to earned media, not your site", "Muck Rack, 25M+ links")],
    "B2B Buyers Moved First")

make("og-bg-096.png", "BG-096 · Travel Referral Data",
    [[("Travel's AI", 'w')], [("Referral ", 'w'), ("Surge", 'g')]],
    ["AI traffic to travel sites up ~200%.",
     "Trip planning is a multi-turn query."],
    [("~200%", "growth in AI referral traffic to travel sites", "Adobe Business Blog"),
     ("138%", "YoY growth in AI referral traffic to retail", "Adobe Digital Insights"),
     ("1,324%", "cumulative AI retail traffic growth since 2024", "Adobe Digital Insights"),
     ("53%", "more time on site for AI-referred visitors", "Adobe, retail data only")],
    "Travel Outpaces Retail")

make("og-bg-097.png", "BG-097 · Local AI Search",
    [[("Local Business,", 'w')], [("Beyond ", 'w'), ("Google Maps", 'g')]],
    ["A complete GBP gets you onto the map.",
     "It won't get you named by AI alone."],
    [("68.01%", "of Google searches ended without a click", "SparkToro, Similarweb panel"),
     ("89%", "of brands never appear in AI category answers", "SE Journal / Victorious"),
     ("0.664-0.709", "correlation between brand mentions and citation", "Ahrefs, 75,000 brands"),
     ("6-7 May 2026", "Google added an Expert Advice block to AI answers", "Google, AI Overviews update")],
    "Consistency Beats One Listing")

make("og-bg-098.png", "BG-098 · Competitor Tracking",
    [[("Tracking ", 'w'), ("Competitors", 'g')], [("Across AI Engines", 'w')]],
    ["Being mentioned is the easy question.",
     "Who's named beside you is the real one."],
    [("<1 in 100", "chance an AI repeats the same brand list twice", "SparkToro, 2,961 queries"),
     ("96% / 82% / 55%", "of responses ChatGPT, Gemini, Claude cite a source", "Muck Rack, 25M+ links"),
     ("0.749-0.821", "cross-platform agreement on which brands get named", "Ahrefs, 75,000 brands"),
     ("89%", "of brands never appear in AI category answers", "SE Journal / Victorious")],
    "Framing Beats Presence")

make("og-bg-099.png", "BG-099 · Quarterly Roundup",
    [[("What Changed in", 'w')], [("AI Search: ", 'w'), ("Q3 2026", 'g')]],
    ["A scannable roundup of what actually",
     "happened in AI search this quarter."],
    [("1 billion", "monthly users AI Mode passed at Google I/O", "Google I/O, 19 May 2026"),
     ("5", "structural changes Google made to AI Overviews", "Google, 6-7 May 2026"),
     ("58%", "drop in CTR on the #1 result with an AI Overview", "Similarweb-based tracking"),
     ("76% to 53%", "fall in ChatGPT's worldwide referral share", "Similarweb, Jun'25-May'26")],
    "First Of A Quarterly Series")

make("og-bg-100.png", "BG-100 · Predictions",
    [[("Five ", 'w'), ("Predictions", 'g')], [("For AI Search in 2026", 'w')]],
    ["Not a forecast dressed up as certainty.",
     "Five calls, and what would prove each wrong."],
    [("53%", "ChatGPT's referral share, down from ~76%", "Similarweb, May 2026"),
     ("36%", "spread between the two largest GEO market estimates", "Disclosed market sizing, 2026"),
     ("$300M+", "disclosed funding across six GEO-native vendors", "Under 2 years, one a unicorn"),
     ("<1 in 100", "chance an AI repeats the same brand list twice", "SparkToro study")],
    "Five Calls, Each Falsifiable")

make("og-bg-101.png", "BG-101 · Market Share",
    [[("Not Just a", 'w')], [("ChatGPT ", 'w'), ("Story Anymore", 'g')]],
    ["ChatGPT still leads AI chat traffic.",
     "Its share of it is shrinking fast."],
    [("53%", "ChatGPT's referral share, down from ~76%", "Similarweb, May 2026"),
     ("1 billion", "monthly users Google AI Mode passed", "Google I/O, May 2026"),
     ("96%, 82%, 55%", "citation frequency for ChatGPT, Gemini, Claude", "Muck Rack, 25M+ links"),
     ("51%", "of B2B buyers now start research in AI chat", "G2, 2026 AI Search Insight")],
    "The Pie Is Splitting")

make("og-bg-102.png", "BG-102 · CMO Survey",
    [[("94% Say ", 'w'), ("AEO", 'g')], [("Few Can Define It", 'w')]],
    ["Near-universal budget intent for 2026.",
     "Nobody agrees what AEO covers."],
    [("94%", "plan to increase AEO or GEO spend in 2026", "Conductor, own survey"),
     ("56%", "called their 2025 AEO/GEO spend significant", "Conductor's survey"),
     ("~12%", "of marketing budgets go to AI visibility", "Conductor's survey"),
     ("3", "overlapping terms, no shared definition", "SEO, AEO, GEO")],
    "Spend Outran Definition")

make("og-bg-103.png", "BG-103 · AI Accuracy",
    [[("Check If AI Gets", 'w')], [("Your ", 'w'), ("Brand Right", 'g')]],
    ["Being mentioned isn't being right.",
     "A method for catching the difference."],
    [("2", "questions to ask every engine directly", "What you do, what it costs"),
     ("51%", "of AI news answers had significant issues", "BBC study, Feb 2025"),
     ("19%", "of BBC-citing answers introduced factual errors", "BBC + EBU study"),
     ("$150,000", "contract canceled after a false AI claim", "Wolf River Electric v. Google")],
    "Check Facts, Not Mentions")

make("og-bg-104.png", "BG-104 · Definitions",
    [[("A Citation", 'w')], [("Is Not ", 'w'), ("a Backlink", 'g')]],
    ["A backlink persists. An AI citation",
     "may not repeat tomorrow."],
    [("0", "guarantee a citation today repeats tomorrow", "Retrieval runs fresh per query"),
     ("96%, 82%, 55%", "citation frequency for ChatGPT, Gemini, Claude", "Muck Rack, 25M+ links"),
     ("<1 in 1,000", "chance the same ranked order repeats twice", "SparkToro study"),
     ("84%", "of AI citations trace to earned media, not your site", "Muck Rack, 25M+ links")],
    "A Citation Is Not A Backlink")
