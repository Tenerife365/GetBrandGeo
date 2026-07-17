from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

BASE = "/sessions/optimistic-tender-cray/mnt/Constantin Daniel Goane--BrandGEO"
OUT = f"{BASE}/marketing/linkedin-company-2026-07-15"
LOGO = f"{BASE}/marketing/logo.png"

W, H = 1200, 627
BG = (10, 10, 15)
TEAL = (0, 212, 170)
MUTED = (136, 136, 170)
WHITE = (232, 232, 240)

FONT_DIR = "/usr/share/fonts/truetype/liberation"
def font(size, bold=True):
    path = f"{FONT_DIR}/LiberationSans-{'Bold' if bold else 'Regular'}.ttf"
    return ImageFont.truetype(path, size)

def gradient_text(draw, img, xy, text, f, c1, c2):
    bbox = draw.textbbox(xy, text, font=f)
    x0, y0, x1, y1 = [int(round(v)) for v in bbox]
    w, h = x1 - x0, y1 - y0
    if w <= 0 or h <= 0:
        draw.text(xy, text, font=f, fill=c1)
        return
    mask = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.text((xy[0]-x0, xy[1]-y0), text, font=f, fill=255)
    grad = Image.new("RGB", (w, h), c1)
    gdraw = ImageDraw.Draw(grad)
    for i in range(w):
        t = i / max(w-1, 1)
        r = int(c1[0] + (c2[0]-c1[0])*t)
        g = int(c1[1] + (c2[1]-c1[1])*t)
        b = int(c1[2] + (c2[2]-c1[2])*t)
        gdraw.line([(i,0),(i,h)], fill=(r,g,b))
    img.paste(grad, (x0, y0), mask)

def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def make_card(filename, eyebrow, headline_lines, stat, stat_label, subline, source):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # soft glow orbs
    glow = Image.new("RGB", (W, H), BG)
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([-200, -250, 500, 350], fill=(40, 20, 80))
    gdraw.ellipse([850, 300, 1450, 800], fill=(10, 50, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    img = Image.blend(img, glow, 0.55)
    draw = ImageDraw.Draw(img)

    # logo + wordmark top-left
    try:
        logo = Image.open(LOGO).convert("RGBA")
        logo_h = 46
        ratio = logo_h / logo.height
        logo = logo.resize((int(logo.width*ratio), logo_h))
        img.paste(logo, (60, 50), logo)
        draw.text((60 + logo.width + 14, 58), "BrandGEO", font=font(28, True), fill=WHITE)
    except Exception:
        draw.text((60, 55), "BrandGEO", font=font(30, True), fill=WHITE)

    # eyebrow
    draw.text((60, 130), eyebrow.upper(), font=font(22, True), fill=TEAL)

    # headline (left column)
    y = 175
    for line in headline_lines:
        draw.text((60, y), line, font=font(46, True), fill=WHITE)
        y += 58

    # subline
    draw.text((60, y+18), subline, font=font(22, False), fill=MUTED)

    # source
    draw.text((60, H-56), source, font=font(18, False), fill=MUTED)

    # right-side stat card
    card_x0, card_y0, card_x1, card_y1 = 820, 130, 1140, 420
    rounded_rect(draw, [card_x0, card_y0, card_x1, card_y1], 20,
                 fill=(19, 19, 26), outline=(34, 34, 58), width=2)
    stat_font = font(72, True)
    sb = draw.textbbox((0,0), stat, font=stat_font)
    sw = sb[2]-sb[0]
    gradient_text(draw, img, (card_x0 + (card_x1-card_x0-sw)//2, card_y0+70), stat, stat_font, (196,181,253), (0,212,170))
    draw = ImageDraw.Draw(img)
    lb = draw.textbbox((0,0), stat_label, font=font(20, True))
    lw = lb[2]-lb[0]
    draw.multiline_text((card_x0 + (card_x1-card_x0)//2 - lw//2, card_y0+200), stat_label,
                         font=font(20, True), fill=MUTED, align="center", spacing=6)

    # footer line
    draw.line([(60, H-90), (W-60, H-90)], fill=(34,34,58), width=1)
    draw.text((W-260, H-56), "getbrandgeo.com", font=font(18, True), fill=TEAL)

    img.save(f"{OUT}/{filename}")
    print("saved", filename)

make_card(
    "01-index-issue1.png",
    "AI Visibility Index",
    ["Issue #1:", "July 2026"],
    "419", "real AI responses\ncollected this issue",
    "7 cities. 5 AI engines. Published with its early limits stated directly.",
    "Source: BrandGEO City Research Program, July 2026"
)

make_card(
    "02-bg016-consensus.png",
    "New Research: BG-016",
    ["Cross-Engine", "Consensus"],
    "10/20", "buyer categories reach\na clear AI consensus",
    "The other 10 show no agreement between engines at all.",
    "Source: BrandGEO cross-city research, BG-016"
)

make_card(
    "03-paris-qonto.png",
    "City Research: Paris",
    ["One Bank,", "Every Engine"],
    "4/4", "AI engines named\nthe same bank first",
    "In both French and English. No exceptions.",
    "Source: BrandGEO Paris research, July 2026"
)

make_card(
    "04-launch-engines.png",
    "Product",
    ["Live AI", "Engine Tracking"],
    "5", "AI engines tracked\nlive today",
    "ChatGPT, Gemini, Perplexity, Claude, and Meta AI.",
    "Source: BrandGEO product announcement"
)

make_card(
    "05-rome-fragmentation.png",
    "City Research: Rome",
    ["When No Engine", "Agrees"],
    "0", "categories reached\nany AI consensus",
    "Each engine stayed internally consistent, just not with each other.",
    "Source: BrandGEO Rome research, July 2026"
)
