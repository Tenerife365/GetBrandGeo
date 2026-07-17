from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

ROOT = "/sessions/optimistic-tender-cray/mnt/Constantin Daniel Goane--BrandGEO"
OUT = os.path.join(ROOT, "marketing/google-business-profile-2026-07-15")
LOGO_MASTER = os.path.join(ROOT, "brandgeo/web/_favicon_master_transparent.png")

BG = (10, 10, 15, 255)         # #0a0a0f
BLUE = (59, 130, 246)          # #3B82F6
PURPLE = (139, 92, 246)        # #8B5CF6
TEAL = (0, 212, 170)           # #00d4aa
MUTED = (156, 163, 175)        # gray-400ish

def font(size, bold=True):
    path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    if not os.path.exists(path):
        # fallback search
        import glob
        cands = glob.glob("/usr/share/fonts/**/*.ttf", recursive=True)
        for c in cands:
            if "Bold" in c and bold:
                path = c; break
            if "Regular" in c and not bold:
                path = c; break
        else:
            path = cands[0] if cands else None
    return ImageFont.truetype(path, size) if path else ImageFont.load_default()

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def gradient_text(base_img, xy, text, f, c1, c2, anchor="la"):
    tmp = Image.new("L", base_img.size, 0)
    d = ImageDraw.Draw(tmp)
    d.text(xy, text, font=f, fill=255, anchor=anchor)
    bbox = tmp.getbbox()
    if bbox is None:
        return
    x0, y0, x1, y1 = [int(round(v)) for v in bbox]
    grad = Image.new("RGBA", base_img.size, c1 + (255,))
    gd = ImageDraw.Draw(grad)
    w = max(1, x1 - x0)
    for x in range(x0, x1 + 1):
        t = (x - x0) / w
        gd.line([(x, y0), (x, y1)], fill=lerp(c1, c2, t) + (255,))
    mask = tmp
    base_img.paste(grad, (0, 0), mask)

def add_glow(base, cx, cy, r, color, alpha=110):
    orb = Image.new("RGBA", base.size, (0,0,0,0))
    od = ImageDraw.Draw(orb)
    od.ellipse([cx-r, cy-r, cx+r, cy+r], fill=color+(alpha,))
    orb = orb.filter(ImageFilter.GaussianBlur(r//2))
    base.alpha_composite(orb)

def load_logo():
    im = Image.open(LOGO_MASTER).convert("RGBA")
    bbox = im.getbbox()
    return im.crop(bbox)

# ---------- 1. Square logo, transparent background, 720x720 ----------
def make_logo_transparent():
    size = 720
    canvas = Image.new("RGBA", (size, size), (0,0,0,0))
    logo = load_logo()
    target_h = int(size * 0.66)
    scale = target_h / logo.height
    logo_r = logo.resize((int(logo.width*scale), target_h), Image.LANCZOS)
    x = (size - logo_r.width)//2
    y = (size - logo_r.height)//2
    canvas.alpha_composite(logo_r, (x, y))
    canvas.save(os.path.join(OUT, "gbp-logo-720-transparent.png"))

# ---------- 2. Square logo, white background, 720x720 ----------
def make_logo_white():
    size = 720
    canvas = Image.new("RGBA", (size, size), (255,255,255,255))
    logo = load_logo()
    target_h = int(size * 0.62)
    scale = target_h / logo.height
    logo_r = logo.resize((int(logo.width*scale), target_h), Image.LANCZOS)
    x = (size - logo_r.width)//2
    y = (size - logo_r.height)//2
    canvas.alpha_composite(logo_r, (x, y))
    canvas.convert("RGB").save(os.path.join(OUT, "gbp-logo-720-white-bg.png"))

# ---------- 3. Cover photo, 1080x608 ----------
def make_cover():
    w, h = 1080, 608
    base = Image.new("RGBA", (w, h), BG)
    add_glow(base, int(w*0.18), int(h*0.25), 260, PURPLE, 90)
    add_glow(base, int(w*0.85), int(h*0.75), 240, TEAL, 70)
    d = ImageDraw.Draw(base)

    logo = load_logo()
    logo_h = 76
    logo_r = logo.resize((int(logo.width*logo_h/logo.height), logo_h), Image.LANCZOS)
    lx, ly = 64, 56
    base.alpha_composite(logo_r, (lx, ly))
    d.text((lx + logo_r.width + 18, ly + logo_h//2), "BrandGEO", font=font(40), fill=(255,255,255,255), anchor="lm")

    f_head = font(56)
    gradient_text(base, (64, 260), "Be the brand", f_head, (196,181,253), BLUE)
    gradient_text(base, (64, 328), "AI recommends.", f_head, BLUE, PURPLE)

    f_sub = font(24, bold=False)
    sub = "Monitor how visible your brand is across ChatGPT, Gemini, Claude,"
    sub2 = "Perplexity, and Meta AI."
    d.text((64, 420), sub, font=f_sub, fill=MUTED+(255,))
    d.text((64, 452), sub2, font=f_sub, fill=MUTED+(255,))

    d.text((64, h-40), "getbrandgeo.com", font=font(20), fill=TEAL+(255,), anchor="lm")

    base.convert("RGB").save(os.path.join(OUT, "gbp-cover-1080x608.png"))

# ---------- 4. Product representation photos, 1200x900 (4:3) ----------
def make_product_card(filename, eyebrow, headline, stat, stat_label, subline):
    w, h = 1200, 900
    base = Image.new("RGBA", (w, h), BG)
    add_glow(base, int(w*0.15), int(h*0.2), 320, PURPLE, 85)
    add_glow(base, int(w*0.9), int(h*0.85), 300, TEAL, 65)
    d = ImageDraw.Draw(base)

    logo = load_logo()
    logo_h = 60
    logo_r = logo.resize((int(logo.width*logo_h/logo.height), logo_h), Image.LANCZOS)
    base.alpha_composite(logo_r, (56, 48))
    d.text((56 + logo_r.width + 16, 48 + logo_h//2), "BrandGEO", font=font(32), fill=(255,255,255,255), anchor="lm")

    d.text((56, 160), eyebrow.upper(), font=font(22), fill=TEAL+(255,))
    f_head = font(48)
    d.text((56, 200), headline, font=f_head, fill=(255,255,255,255))

    # stat card, right side (drawn on a separate RGBA overlay, then alpha-composited
    # so the translucency actually blends instead of being flattened to solid white
    # by the final convert("RGB") call)
    card_x0, card_y0, card_x1, card_y1 = 780, 340, 1140, 560
    card_overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(card_overlay)
    cd.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=24, fill=(255, 255, 255, 22))
    cd.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=24, outline=(255, 255, 255, 60), width=1)
    base.alpha_composite(card_overlay)
    f_stat = font(64)
    gradient_text(base, (card_x0+28, card_y0+30), stat, f_stat, (196,181,253), TEAL)
    d.text((card_x0+28, card_y0+120), stat_label, font=font(22, bold=False), fill=MUTED+(255,))

    f_sub = font(24, bold=False)
    d.text((56, 620), subline, font=f_sub, fill=MUTED+(255,))
    d.text((56, h-48), "getbrandgeo.com", font=font(20), fill=TEAL+(255,), anchor="lm")

    base.convert("RGB").save(os.path.join(OUT, filename))

os.makedirs(OUT, exist_ok=True)
make_logo_transparent()
make_logo_white()
make_cover()
make_product_card(
    "gbp-product-1-ai-visibility-score.png",
    "How it works",
    "The AI Visibility Score",
    "6",
    "dimensions tracked per brand",
    "Recognition, Knowledge, Sentiment, Accuracy, Reach, Consistency."
)
make_product_card(
    "gbp-product-2-engine-coverage.png",
    "Live engine coverage",
    "5 AI engines, one dashboard",
    "5/5",
    "engines tracked live",
    "ChatGPT, Gemini, Claude, Perplexity, and Meta AI."
)
print("done")
for f in sorted(os.listdir(OUT)):
    print(f)
