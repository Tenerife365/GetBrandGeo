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

    badge = "BrandGEO Research™"
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
        d.text((cx+28, cy+22), num, font=f(58), fill=col)
        lf = f(25)
        while d.textlength(label, font=lf) > cw - 56 and lf.size > 18:
            lf = f(lf.size - 1)
        d.text((cx+28, cy+100), label, font=lf, fill=WHITE)
        d.text((cx+28, cy+140), src, font=f(21, False), fill=GRAY2)

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

    out = os.path.join(WEB, "images", fname)
    img.save(out, "PNG")
    print("saved", out)

make("bg-023-hero.png", "BG-023 · AI SEO Crawler",
    [[("Auditing AI-readiness", 'w')], [("without", 'g'), (" a paid API.", 'w')]],
    ["Sitemap-first discovery, robots.txt respect, regex-based",
     "structure detection. Free by design, not by accident."],
    [("25", "pages crawled per audit by default", "sitemap-first, _seo_crawl.js"),
     ("8s", "fetch timeout per page", "FETCH_TIMEOUT_MS"),
     ("1.5MB", "max page size read, truncated not skipped", "MAX_HTML_BYTES"),
     ("5", "structural signals detected per page", "JSON-LD, FAQ, tables, lists, H1")],
    "Free AI-Readiness Site Crawler")
