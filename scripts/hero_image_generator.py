from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

WEB = "/sessions/upbeat-jolly-hypatia/mnt/Constantin Daniel Goane--BrandGEO/brandgeo/web"
W, H = 1149, 1369
BG = (8, 8, 15)          # ~#0a0a0f site bg
CARD = (17, 17, 28)      # card surface
BORDER = (255, 255, 255, 24)
WHITE = (255, 255, 255)
GRAY = (255, 255, 255, 165)
GRAY2 = (255, 255, 255, 110)
TEAL = (0, 212, 170)     # --ac2
VIOLET = (139, 92, 246)  # #8b5cf6
GRAD_A = (59, 130, 246)  # #3B82F6
GRAD_B = (139, 92, 246)  # #8B5CF6

FB = "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"
def f(sz, bold=True): return ImageFont.truetype(FB if bold else FR, sz)

def grad_text(draw_img, xy, text, font, c1, c2):
    # render text filled with horizontal gradient
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

    # soft violet glow top-left, teal glow bottom-right
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-350, -350, 600, 600], fill=(30, 22, 60))
    gd.ellipse([W-500, H-450, W+350, H+350], fill=(8, 38, 34))
    glow = glow.filter(ImageFilter.GaussianBlur(180))
    img = Image.blend(img, glow, 0.9)
    d = ImageDraw.Draw(img, "RGBA")

    # header: logo + wordmark
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

    # research badge top-right
    badge = "BrandGEO Research™"
    bf = f(24)
    btw = d.textlength(badge, font=bf)
    bx1, by1 = W - 60 - btw - 44, 66
    d.rounded_rectangle([bx1, by1, W-60, by1+52], radius=26, outline=(0,212,170,90), width=2, fill=(0,212,170,22))
    d.text((bx1+22, by1+12), badge, font=bf, fill=TEAL)

    # kicker
    y = 240
    d.text((62, y), kicker.upper(), font=f(28), fill=TEAL)
    y += 66

    # headline lines: list of segments (text, 'w'|'g')
    hf = f(84)
    for line in lines:
        x = 60
        for seg, style in line:
            if style == 'g':
                grad_text(img, (int(x), y), seg, hf, GRAD_A, GRAD_B)
                d = ImageDraw.Draw(img, "RGBA")
            else:
                d.text((x, y), seg, font=hf, fill=WHITE)
            x += d.textlength(seg, font=hf)
        y += 100
    y += 26

    # subline (wrapped manually, passed as list)
    for s in sub:
        d.text((62, y), s, font=f(31, False), fill=GRAY)
        y += 46
    
    # stat cards 2x2
    top = y + 40
    gap = 24
    cw = (W - 120 - gap) // 2
    ch = 190
    for i, (num, label, src) in enumerate(stats):
        cx = 60 + (i % 2) * (cw + gap)
        cy = top + (i // 2) * (ch + gap)
        d.rounded_rectangle([cx, cy, cx+cw, cy+ch], radius=18, fill=(17,17,28,255), outline=(255,255,255,26), width=2)
        col = TEAL if i % 2 == 0 else VIOLET
        d.text((cx+28, cy+22), num, font=f(62), fill=col)
        lf = f(26)
        while d.textlength(label, font=lf) > cw - 56 and lf.size > 20:
            lf = f(lf.size - 1)
        d.text((cx+28, cy+100), label, font=lf, fill=WHITE)
        d.text((cx+28, cy+140), src, font=f(22, False), fill=GRAY2)

    # pillar row
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

    # footer
    fy = H - 92
    d.line([(60, fy), (W-60, fy)], fill=(255,255,255,30), width=2)
    d.text((60, fy+24), "getbrandgeo.com", font=f(30), fill=TEAL)
    note_w = d.textlength(footer_note, font=f(26, False))
    d.text((W-60-note_w, fy+28), footer_note, font=f(26, False), fill=GRAY)

    out = os.path.join(WEB, "images", fname)
    img.save(out, "PNG")
    print("saved", out)

make("bg-012-hero.png", "BG-012 · Measurement",
    [[("A ", 'w'), ("mention", 'g'), (" is not", 'w')], [("visibility.", 'w')]],
    ["Why counting brand mentions misleads you — and what the",
     "AI Visibility Score actually measures across 6 dimensions."],
    [("35%", "higher CTR for AI-cited brands", "Source: Averi / wellows.com"),
     ("20%", "of brands stay visible run-to-run", "Source: AirOps"),
     ("5x", "conversion rate of AI-referred traffic", "Source: Forrester"),
     ("6", "dimensions in one visibility score", "BrandGEO methodology")],
    "AI Visibility vs. Brand Mentions")

make("bg-013-hero.png", "BG-013 · Content Freshness",
    [[("How often must you", 'w')], [("publish", 'g'), (" to stay cited?", 'w')]],
    ["AI engines reward freshness far more aggressively than",
     "Google ever did. The publishing cadence data, engine by engine."],
    [("3.2x", "more ChatGPT citations, content <30 days", "Source: GrowByData"),
     ("82%", "Perplexity citation share, content <30 days", "Source: BG-013 analysis"),
     ("37%", "same share once content passes 6 months", "Source: BG-013 analysis"),
     ("50%", "of AI-cited content is under 13 weeks old", "Source: Amsive")],
    "Publishing Cadence & AI Citations")

make("bg-014-hero.png", "BG-014 · Multilingual GEO",
    [[("Invisible", 'g'), (" to AI", 'w')], [("outside English.", 'w')]],
    ["The multilingual visibility gap: why AI engines forget your",
     "brand the moment the conversation isn't in English."],
    [("89.7%", "of Llama 2's training corpus is English", "Source: Meta (published data)"),
     ("5x", "citation-share swing, English vs Spanish", "Source: Profound, 3.25B citations"),
     ("327%", "more AI Overview visibility when localized", "Source: PR.co, 1.3M citations"),
     ("14", "countries measured across 7 AI models", "Source: Profound")],
    "AI Visibility Beyond English")

make("bg-015-hero.png", "BG-015 · KPI Framework",
    [[("The AI visibility ", 'w')], [("KPIs", 'g'), (" that matter.", 'w')]],
    ["Beyond “are we mentioned?” — the measurement framework",
     "that separates real AI visibility from a lucky sample."],
    [("11pts", "score swing from methodology alone", "Source: LLM Pulse"),
     ("~30%", "of brands stay visible run-to-run", "Source: BG-015 analysis"),
     ("11%", "citation overlap: ChatGPT vs Perplexity", "Source: BG-015 analysis"),
     ("70%", "of AI referral traffic invisible to GA4", "Source: Clickport / Digital Bloom")],
    "AI Visibility KPIs")

make("bg-017-hero.png", "BG-017 · Published Paper",
    [[("Now a ", 'w'), ("published", 'g')], [("academic paper.", 'w')]],
    ["Our seven-city AI visibility dataset, formalized, disclosed",
     "limits and all, and openly licensed under a permanent DOI."],
    [("222", "real AI responses analyzed", "Source: Zenodo DOI 10.5281/zenodo.21395598"),
     ("56", "buyer-intent prompts, 7 cities", "Source: paper, Table 1"),
     ("4", "AI engines compared directly", "Gemini, Claude, Perplexity, Meta AI"),
     ("CC BY 4.0", "openly licensed, freely citable", "Source: Zenodo license terms")],
    "Cross-Engine Consensus Study")
