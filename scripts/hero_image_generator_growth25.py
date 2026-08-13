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


make("og-bg-036.png", "BG-036 \u00b7 Buyer's Guide",
    [[("13 GEO Tools,", 'w')], [("Real ", 'w'), ("Pricing", 'g')]],
    ["What each vendor's headline price actually",
     "includes, and what's a paid add-on."],
    [("13", "vendors compared against their own pricing pages", "Direct research, Aug 2026"),
     ("$300M+", "disclosed funding across 6 GEO-native vendors", "Crunchbase, Tracxn"),
     ("<1%", "chance the same AI platform repeats a brand list", "SparkToro study"),
     ("3", "vendors with no public pricing at all", "Bluefish, Evertune, Goodie AI")],
    "13 Vendors Compared")

make("og-bg-035.png", "BG-035 \u00b7 Research Map",
    [[("The Complete Map", 'w')], [("of AI ", 'w'), ("Citation Data", 'g')]],
    ["Five studies that actually disclose",
     "their sample size and method."],
    [("84%", "of AI citations trace to earned media, not owned sites", "Muck Rack, 25M+ links"),
     ("99.99%", "of logged citations pointed to third-party domains", "SE Journal / Victorious"),
     ("0.74", "strongest correlation found: YouTube mentions vs AI Mode", "Ahrefs, 75,000 brands"),
     ("42%", "of 'fresh-looking' pages were published within the year", "Seer Interactive")],
    "Five Disclosed Studies")

make("og-bg-037.png", "BG-037 \u00b7 Methodology",
    [[("No Two Scores", 'w')], [("Ever ", 'w'), ("Agree", 'g')]],
    ["Why AI visibility scores vary, and how",
     "to read one without being misled."],
    [("<1%", "chance an AI platform repeats a brand list twice", "SparkToro, 2,961 queries"),
     ("615x", "citation-rate spread reported across engines, one brand", "2026 industry estimate"),
     ("49/100", "median score three benchmarks converge on", "Definitions differ, maybe coincidence"),
     ("1 in 1,000", "chance the list returns in the same order", "SparkToro study")],
    "Read The Trend, Not One Score")

make("og-bg-038.png", "BG-038 \u00b7 Myth-Bust",
    [[("Six Claims,", 'w')], [("Checked ", 'w'), ("Against Data", 'g')]],
    ["Schema, backlinks, freshness and search",
     "triggers, tested against disclosed research."],
    [("0%", "significant citation lift from adding schema markup", "Ahrefs, matched-control test"),
     ("Undisclosed", "how often ChatGPT triggers a web search", "OpenAI has never published it"),
     ("0.49", "strongest disclosed backlink correlation found", "Still rated moderate, not strong"),
     ("6 months", "median age of content earning sustained citation", "Seer Interactive")],
    "Six Claims Checked")

make("og-bg-039.png", "BG-039 \u00b7 Traffic Data",
    [[("The Zero-Click", 'w')], [("Shift", 'g')]],
    ["68% of searches now end without a click.",
     "Here is where the traffic actually went."],
    [("68.01%", "of Google searches ended without a click", "SparkToro, Jan to Apr 2026"),
     ("1,324%", "growth in AI-referred retail traffic since Oct 2024", "Adobe, 1T+ visits"),
     ("60%", "drop in small-publisher search referral traffic", "Chartbeat-sourced data"),
     ("$550M/yr", "estimated value of Reddit's AI licensing deals", "Wells Fargo estimate")],
    "68% End Without A Click")

make("og-bg-040.png", "BG-040 \u00b7 Legacy Tools",
    [[("Is GEO Just SEO", 'w')], [("With a ", 'w'), ("New Name?", 'g')]],
    ["9 legacy SEO tools checked against",
     "their own product pages."],
    [("9", "legacy SEO platforms with a new AI-citation feature", "Semrush to AWR, checked directly"),
     ("0", "built dedicated prompt-and-response infrastructure", "All extended an existing pipeline"),
     ("28.7B", "keywords Ahrefs filters to build Brand Radar", "Most disclosed methodology found"),
     ("$129/mo", "Ahrefs' entry tier, Brand Radar included free", "During its current beta")],
    "9 Legacy Tools Checked")

make("og-bg-041.png", "BG-041 \u00b7 Engine Coverage",
    [[("How Many Engines", 'w')], [("Do You ", 'w'), ("Actually Need?", 'g')]],
    ["A bigger number is not more useful if",
     "half of it sits behind an upsell."],
    [("17+", "the broadest named engine count, claimed by Rankscale", "Credit-based, cost varies per engine"),
     ("8", "engines AthenaHQ includes at every tier, no paywall", "Its entire pricing argument"),
     ("55%", "of responses Claude cites a source in, vs 96% ChatGPT", "Muck Rack, full data in BG-035"),
     ("4", "core engines in Otterly's headline-priced plan", "3 more sold separately")],
    "Match Coverage To Your Prompts")

make("og-bg-042.png", "BG-042 \u00b7 Funding",
    [[("The GEO Funding", 'w')], [("Boom, ", 'w'), ("Mapped", 'g')]],
    ["$300M+ raised, one $1B valuation,",
     "inside two years."],
    [("$1B", "Profound's valuation at its Feb 2026 Series C", "18 months after a $3.5M seed"),
     ("$300M+", "disclosed funding across 6 GEO-native vendors", "Under 2 years, none pre-2023"),
     ("$2.7M", "AthenaHQ's total funding, the smallest by far", "Still launched with 8 engines, no paywall"),
     ("$189B", "largest month of global startup funding ever", "Feb 2026, driven by OpenAI/Anthropic/Waymo")],
    "6 Startups, $300M+ Raised")

make("og-bg-043.png", "BG-043 \u00b7 Platform Change",
    [[("What Google's May 2026", 'w')], [("Overhaul ", 'w'), ("Changed", 'g')]],
    ["5 structural changes, and what each one",
     "means for where you invest attention."],
    [("5", "structural changes to AI Overviews, May 6 to 7, 2026", "One of Google's biggest updates yet"),
     ("58%", "CTR drop on the #1 result on AI-Overview queries", "Up from 34.5% in April 2025"),
     ("1B", "AI Mode's monthly users as of Google I/O", "May 19, 2026, about a year post-launch"),
     ("US English", "the rollout sequencing, other markets followed", "Check your own market's current state")],
    "5 Changes, 1 Weekend")

make("og-bg-044.png", "BG-044 \u00b7 Engine Mechanics",
    [[("How 4 AI Engines", 'w')], [("Pick ", 'w'), ("Their Sources", 'g')]],
    ["4 genuinely different retrieval",
     "architectures, no shared playbook."],
    [("Binary", "ChatGPT's citation model, no ranked position", "Cited or not, nothing in between"),
     ("$14", "per 1,000 search queries, Gemini grounding billing", "Since Jan 2026, was a flat $35/1,000 prompts"),
     ("200B+", "URLs in Perplexity's claimed index", "Vendor's own account, not independently audited"),
     ("Brave Search", "the backend behind Claude's web search tool", "Run by Anthropic, not a direct Google link")],
    "4 Engines, 4 Architectures")

make("og-bg-045.png", "BG-045 \u00b7 Expert Commentary",
    [[("What The Experts", 'w')], [("Think ", 'w'), ("Comes Next", 'g')]],
    ["Lily Ray, Glenn Gabe, Mike King, and",
     "a survey of 94% planning to spend more."],
    [("24 hours", "for 4 AI engines to absorb a fabricated claim", "Lily Ray's own reported demonstration"),
     ("97%", "of marketing leaders reporting positive AEO impact", "Conductor / Search Engine Journal survey"),
     ("94%", "planning to increase AEO or GEO spend in 2026", "Same survey, self-reported"),
     ("56%", "who called their 2025 GEO investment significant", "Self-reported, not independently audited")],
    "4 Voices, 1 Survey")

make("og-bg-046.png", "BG-046 \u00b7 AI Accuracy",
    [[("The BBC Tested AI", 'w')], [("News ", 'w'), ("Accuracy Twice", 'g')]],
    ["Still wrong on sourcing three times",
     "out of ten, a year later."],
    [("51%", "of AI news answers had significant issues", "BBC study, February 2025"),
     ("45%", "issue rate in the larger follow-up study", "BBC + EBU, October 2025"),
     ("19%", "of BBC-citing answers introduced factual errors", "Not present in the original reporting"),
     ("13%", "of quotes attributed to BBC were altered", "Fabricated, not paraphrased")],
    "Cited Is Not Cited Correctly")

make("og-bg-047.png", "BG-047 \u00b7 Brand Risk",
    [[("When an AI Overview", 'w')], [("Accuses ", 'w'), ("You Falsely", 'g')]],
    ["Two live lawsuits, two continents,",
     "one measurable failure mode."],
    [("$150,000", "contract canceled after a false AI claim", "Wolf River Electric v. Google"),
     ("$24.7M", "damages alleged for 2024 alone", "Part of a $110 to $210M total claim"),
     ("Mar 2026", "when Wolf River Electric filed suit", "Minnesota, wrong-defendant AI claim"),
     ("May 2026", "when Ashley MacIsaac filed suit", "Ontario, false sex-offender claim")],
    "2 Lawsuits, 1 Failure Mode")

make("og-bg-048.png", "BG-048 \u00b7 Review Economy",
    [[("Inside The GEO Tool", 'w')], [("Review-Site ", 'w'), ("Economy", 'g')]],
    ["How to tell an independent review",
     "from an affiliate funnel."],
    [("7", "secondary sites this research itself leaned on", "No primary source existed for 2 vendors"),
     ("2", "vendors with no public pricing at all", "Bluefish AI and Goodie AI"),
     ("404", "the status code on Bluefish AI's pricing URL", "Every CTA is a demo request instead"),
     ("4", "checks to spot a disclosed, independent review", "Method, sourcing, disclosure, originality")],
    "4 Checks Before You Trust It")

make("og-bg-049.png", "BG-049 \u00b7 AI Shopping",
    [[("AI Shopping Agents,", 'w')], [("A ", 'w'), ("Different Problem", 'g')]],
    ["Being cited well in ChatGPT gets you",
     "nothing inside a shopping agent."],
    [("$50M", "Daydream's seed funding", "AI shopping discovery platform"),
     ("1.5M+", "shoppers using it at beta exit", "10,000+ merchants indexed alongside them"),
     ("25+", "brands signed beyond its live partners", "STAUD, Alice + Olivia and others"),
     ("2", "separate visibility problems, 1 category label", "Chat citation vs shopping-agent surfacing")],
    "Discovery Is Not Citation")

make("og-bg-050.png", "BG-050 \u00b7 Funding vs Product",
    [[("Does The Funding", 'w')], [("Show Up ", 'w'), ("In The Product?", 'g')]],
    ["Bootstrapped vs venture-backed GEO",
     "tools, checked on pricing honesty."],
    [("$63M", "raised by Bluefish AI, pricing page still a 404", "The most funded, least transparent"),
     ("$2.7M", "AthenaHQ's total funding", "The least funded, most transparent"),
     ("3 platforms", "what one G2 review says Peec AI's $95 covers", "Vendor's page lists 6 at that price"),
     ("0", "bootstrapped vendors with fully hidden pricing", "That distinction belongs to 2 funded ones")],
    "Funding Doesn't Buy Honesty")

make("og-bg-051.png", "BG-051 \u00b7 Buyer Behavior",
    [[("Who's Starting", 'w')], [("In AI ", 'w'), ("Search Now?", 'g')]],
    ["Three audiences, three speeds,",
     "one direction."],
    [("31.3%", "of the US population, forecast for 2026", "EMARKETER"),
     ("66%", "of 18 to 24 year-olds use ChatGPT to find info", "Fractl / Search Engine Land, 2,000+ surveyed"),
     ("51%", "of B2B software buyers now start in a chatbot", "Up from 29% in April 2025, G2"),
     ("71%", "of B2B buyers rely on chatbots at all", "Up from ~60% seven months earlier")],
    "B2B Moved Fastest")

make("og-bg-052.png", "BG-052 \u00b7 GEO Playbook",
    [[("A Practical Playbook", 'w')], [("For ", 'w'), ("Getting Cited", 'g')]],
    ["9 recommendations, each one traced",
     "to a published, sourced finding."],
    [("5", "techniques with real measured evidence", "Out of 9 tested in the founding study"),
     ("4", "techniques that did nothing or hurt", "Including keyword stuffing"),
     ("84%", "of AI citations trace to earned media", "Not a brand's own website"),
     ("4", "engines covered separately, not as one target", "Each retrieves sources differently")],
    "9 Cited Recommendations")

make("og-bg-053.png", "BG-053 \u00b7 Self-Audit",
    [[("Read Your Brand's", 'w')], [("AI Answers ", 'w'), ("Like an Auditor", 'g')]],
    ["No tool, no budget, about",
     "twenty minutes."],
    [("2", "prompt types every self-audit needs", "Direct-brand and category questions"),
     ("<1%", "chance a platform repeats a brand list", "Why one run tells you nothing"),
     ("4", "things to check in every single answer", "Mention, citation, sentiment, accuracy"),
     ("45-51%", "measured issue rate on AI news answers", "Even from a heavily-resourced newsroom")],
    "20 Minutes, No Tool Needed")

make("og-bg-054.png", "BG-054 \u00b7 GEO Checklist",
    [[("The GEO Content", 'w')], [("Checklist, ", 'w'), ("Cited", 'g')]],
    ["8 items, each one carrying a link",
     "to the study behind it."],
    [("8", "checklist items, each one sourced", "No item is a guess dressed as a rule"),
     ("1", "matched-control study behind item 6", "Schema markup, a negative finding"),
     ("5", "earlier articles this list draws from", "Every citation traces back to one"),
     ("0", "guarantees made anywhere on this list", "Correlational or single-study evidence")],
    "Every Item Is Sourced")
