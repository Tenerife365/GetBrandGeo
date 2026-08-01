"""
BrandGEO PRODUCT images: one set per plan, every size the sales surfaces need.

Foundation is docs/growth/grok-launch/images/_build/render_launch_images.py.
Pillow only. No matplotlib, no cairosvg, no ImageMagick, none of which are
installed. Shapes are drawn into 8x supersampled masks and downsampled with
Lanczos, the same technique as the launch renderer.

WHAT MAKES THE SEVEN PLANS SEPARABLE, and it is deliberately not colour:
every plan uses the SAME palette. The discriminator is a countable dial.

    Free         1 of 7 segments filled, centre numeral 1
    Radar        2 of 7 filled,          centre numeral 2
    Essentials   3 of 7 filled,          centre numeral 3
    Growth       5 of 7 filled,          centre numeral 5
    Growth PRO   7 of 7 filled,          centre numeral 7
    Managed      7 of 7 filled + a continuous outer ring
    Enterprise   7 of 7 filled + 9 discrete outer pips (7 solid, 2 hollow,
                 for Copilot and DeepSeek, which are reserved and do not
                 collect)

RADAR ADDED 2026-07-31, and it costs the dial nothing, which is the reason the
tier could be added without redrawing anything. Radar carries 2 live engines and
sits between Free (1) and Essentials (3), so the numeral sequence goes 1, 2, 3,
5, 7, 7, 7 and stays strictly non-decreasing along PLAN_ORDER. A dial keyed to a
countable product fact absorbs a new tier; a dial keyed to a hue would have
needed a seventh colour nobody had reserved.

Segment count, centre numeral and outer-ring form are three redundant shape
channels. None of them is a hue. A greyscale invoice and a colour-blind buyer
see the same thing a trichromat does.

Product truth is read from, and asserted against, PLAN_FACTS below, which was
transcribed from brandgeo-dashboard/src/lib/planConfig.ts on 2026-07-30,
RE-TRANSCRIBED 2026-07-31 after the sprint ladder ruling landed in code, and
cross-checked against netlify/functions/_cost.js PLAN_LIVE_ENGINES and the
Supabase table public.plan_prompt_caps.

Run: python render_product_images.py
"""

import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
SHARED = os.path.abspath(os.path.join(HERE, "..", "..", "_shared"))
FONTS = os.path.join(SHARED, "fonts")
LOGO = os.path.join(SHARED, "logo")
MARK_PATH = os.path.join(LOGO, "brandgeo-mark-transparent-h512.png")
LOCKUP_PATH = os.path.join(LOGO, "brandgeo-lockup-dark-transparent-w512.png")

SS = 8  # supersample factor for shape masks

# ---------------------------------------------------------------- palette ---
# docs/growth/channel-specs-2026-07-29.md, via the campaign BRIEF section 5.
BG = "#0a0b0e"      # canvas
S = "#101116"       # card surface
BD = "#23242b"      # hairline border
BD2 = "#32333c"     # stronger border
AC = "#8b5cf6"      # primary violet, FILL only, never a text colour
ACS = "#7c3aed"     # CTA fill
ACT = "#a78bfa"     # accent WORDS
T = "#e8e9ed"       # primary text
T2 = "#9ba1ac"      # secondary text
T3 = "#7d838f"      # muted text
WHITE = "#ffffff"   # only ever on ACS

# ------------------------------------------------------------ product truth --
# Transcribed 2026-07-30 from brandgeo-dashboard/src/lib/planConfig.ts and
# RE-READ 2026-07-31 against the same file after the sprint ladder ruling
# (docs/strategy/sprint-ladder-ruling.md) shipped into code:
#   PLAN_ENGINES (:53), COMING_SOON_ENGINES (:85), PLAN_PROMPTS (:530),
#   PLAN_COLLECTION_COOLDOWN_HOURS (:549), PLAN_SEO_PAGE_CAP (:664).
# Prices from planConfig.ts PLAN_LABELS + src/pages/Account.tsx PLAN_TIERS (:38),
# cross-read against the live pricing cards in brandgeo/web/index.html.
#
# THREE FACTS CHANGED ON 2026-07-31 AND EVERY ONE OF THEM MAKES AN ALREADY
# RENDERED IMAGE WRONG, which is why the whole set is re-rendered and not just
# the new tier:
#   1. Free runs GEMINI, not ChatGPT (ruling decision 1b). The Free image said
#      "ChatGPT only". Free's engine COUNT is unchanged at 1, so the dial is
#      identical and the defect was invisible to check C, which counts segments
#      and cannot read a word.
#   2. Radar enters the ladder between Free and Essentials at 2 engines.
#   3. PLAN_PROMPTS moved on three tiers: essentials 15 to 18, growth_pro 35 to
#      56, managed 120 to 200. The images never printed a prompt count, so this
#      only reaches the rendered files through COPY.md, but the numbers live
#      here so the two cannot drift apart.
PLAN_FACTS = [
    {
        "key": "free",
        "engine_names": ["Gemini"],
        "label": "Free",
        "stripe_name": "BrandGEO Free",
        "price": "EUR 0",
        "price_glyph": "€0",
        "live_engines": 1,
        "reserved": 0,
        "outer": None,
        # WAS "ChatGPT only" until 2026-07-31. PLAN_ENGINES.free is ['gemini'].
        "fact": "Gemini only",
        "prompts": 5,
        "cooldown_h": 720,
        "seo_pages": 0,
    },
    {
        "key": "radar",
        "engine_names": ["Gemini", "Claude"],
        "label": "Radar",
        "stripe_name": "BrandGEO Radar",
        # TWO PRICES ARE LIVE AT ONCE and the image carries the one a buyer is
        # actually charged. EUR 29 is the launch price for the first 100
        # subscribers; EUR 39 is list. The word "launch" is on the glyph
        # deliberately: these files outlive the launch cohort, and a bare
        # "EUR 29 / mo" on a Stripe product image or a social post would become
        # a false price the day the EUR 29 price object is deactivated, with
        # nothing failing and nobody looking. The live pricing card frames it
        # the same way, eyebrow "Launch price" plus "List EUR 39/mo after
        # launch" (brandgeo/web/index.html:2858-2866).
        "price": "EUR 29 / mo launch",
        "price_glyph": "€29 / mo launch",
        "live_engines": 2,
        "reserved": 0,
        "outer": None,
        # GEMINI AND CLAUDE, not ChatGPT and Gemini. Constantin amended the
        # brief on cost: ChatGPT was 77% of the tier's modelled spend while
        # being one engine of two. Radar is a strict SUPERSET of Free, which is
        # the whole reason decision 1b moved Free to Gemini in the same breath.
        "fact": "Gemini and Claude, weekly",
        "prompts": 7,
        "cooldown_h": 168,
        "seo_pages": 0,
    },
    {
        "key": "essentials",
        "engine_names": ["ChatGPT", "Gemini", "Claude"],
        "label": "Essentials",
        "stripe_name": "BrandGEO Essentials",
        "price": "EUR 99 / mo",
        "price_glyph": "€99 / mo",
        "live_engines": 3,
        "reserved": 0,
        "outer": None,
        "fact": "ChatGPT, Gemini, Claude",
        "prompts": 18,   # was 15 before 2026-07-31
        "cooldown_h": 168,
        "seo_pages": 0,
    },
    {
        "key": "growth",
        "engine_names": ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode"],
        "label": "Growth",
        "stripe_name": "BrandGEO Growth",
        "price": "EUR 299 / mo",
        "price_glyph": "€299 / mo",
        "live_engines": 5,
        "reserved": 0,
        "outer": None,
        "fact": "Adds Perplexity and Google AI Mode",
        "prompts": 35,
        "cooldown_h": 168,
        "seo_pages": 10,
    },
    {
        "key": "growth_pro",
        "engine_names": ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                          "Grok", "Google AI Overviews"],
        "label": "Growth PRO",
        "stripe_name": "BrandGEO Growth PRO",
        "price": "EUR 449 / mo",
        "price_glyph": "€449 / mo",
        "live_engines": 7,
        "reserved": 0,
        "outer": None,
        "fact": "Adds Grok and Google AI Overviews",
        "prompts": 56,   # was 35 before 2026-07-31
        "cooldown_h": 168,
        "seo_pages": 30,
    },
    {
        "key": "managed",
        "engine_names": ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                          "Grok", "Google AI Overviews"],
        "label": "Managed",
        "stripe_name": "BrandGEO Managed",
        "price": "from EUR 1,500 / mo",
        "price_glyph": "from €1,500 / mo",
        "live_engines": 7,
        "reserved": 0,
        "outer": "ring",
        "fact": "All seven, run for you",
        "prompts": 200,   # was 120 before 2026-07-31
        "cooldown_h": 168,
        "seo_pages": 100,
    },
    {
        "key": "enterprise",
        "engine_names": ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                          "Grok", "Google AI Overviews"],
        "label": "Enterprise",
        "stripe_name": "BrandGEO Enterprise",
        "price": "Custom",
        "price_glyph": "Custom",
        "live_engines": 7,
        "reserved": 2,
        "outer": "pips",
        "fact": "All seven, no usage ceiling",
        "prompts": None,   # 100000 in code, presented as no published ceiling
        "cooldown_h": 0,
        "seo_pages": 500,
    },
]

SEGMENTS = 7   # the number of engines that actually collect, Growth PRO and up


# ------------------------------------------------------------ colour math ---
def hexs(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(c):
    r, g, b = c if isinstance(c, tuple) else hexs(c)
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + 0.05) / (lo + 0.05), 2)


# ------------------------------------------------------------ shape masks ---
def mask_rrect(w, h, radius):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def mask_arc(size, thickness, start_deg, end_deg):
    """Antialiased annular arc mask, drawn 8x then downsampled."""
    n = size * SS
    m = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(m)
    d.pieslice([0, 0, n - 1, n - 1], start_deg, end_deg, fill=255)
    t = thickness * SS
    d.ellipse([t, t, n - 1 - t, n - 1 - t], fill=0)
    return m.resize((size, size), Image.LANCZOS)


def mask_ring(size, thickness):
    n = size * SS
    m = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(m)
    d.ellipse([0, 0, n - 1, n - 1], fill=255)
    t = thickness * SS
    d.ellipse([t, t, n - 1 - t, n - 1 - t], fill=0)
    return m.resize((size, size), Image.LANCZOS)


def mask_disc(size):
    n = size * SS
    m = Image.new("L", (n, n), 0)
    ImageDraw.Draw(m).ellipse([0, 0, n - 1, n - 1], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def paste_flat(base, mask, xy, colour):
    layer = Image.new("RGB", mask.size, hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, xy, mask)


# ------------------------------------------------------------------ type ----
_font_cache = {}


def font(weight, size):
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONTS, f"Inter-{weight}.ttf"), size)
    return _font_cache[key]


def text(d, xy, s, f, fill, anchor="la", tracking=0.0):
    """NOTE: a non-zero tracking draws one glyph per call, which loses kerning
    and, at negative values on heavy weights, makes adjacent glyphs overlap and
    gouge each other. The plan-name headlines were authored at -0.018 em and
    came out visibly notched between n/t and r/i/s. They are drawn untracked
    now, in a single call, so Pillow does the layout. Keep tracking for small
    all-caps labels only, where it is positive."""
    if not tracking:
        d.text(xy, s, font=f, fill=hexs(fill) if isinstance(fill, str) else fill, anchor=anchor)
        return
    step = tracking * f.size
    total = sum(f.getlength(ch) + step for ch in s) - step
    x, y = xy
    if anchor[0] == "m":
        x -= total / 2.0
    elif anchor[0] == "r":
        x -= total
    va = anchor[1]
    for ch in s:
        d.text((x, y), ch, font=f, fill=hexs(fill) if isinstance(fill, str) else fill,
               anchor="l" + va)
        x += f.getlength(ch) + step


def tracked_width(s, f, tracking):
    step = tracking * f.size
    return sum(f.getlength(ch) + step for ch in s) - step


def fit_font(lines, weight, start, max_w, floor=12):
    size = start
    while size > floor and max(font(weight, size).getlength(s) for s in lines) > max_w:
        size -= 1
    return font(weight, size)


def wrap(s, f, max_w):
    words, lines, cur = s.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if f.getlength(trial) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# --------------------------------------------------------------- brand art --
_asset_cache = {}


def _trimmed(path):
    if path not in _asset_cache:
        im = Image.open(path).convert("RGBA")
        _asset_cache[path] = im.crop(im.getchannel("A").getbbox())
    return _asset_cache[path]


def place_mark(base, x, y, height, anchor="lt"):
    """The mark alone. Used where the lockup's wordmark would be sub-pixel.
    Never upscaled past the source raster (362x512)."""
    m = _trimmed(MARK_PATH)
    height = min(height, m.height)
    w = int(round(height * m.width / m.height))
    m = m.resize((w, height), Image.LANCZOS)
    px = x if anchor[0] == "l" else x - w if anchor[0] == "r" else x - w // 2
    py = y if anchor[1] == "t" else y - height if anchor[1] == "b" else y - height // 2
    base.paste(m, (int(px), int(py)), m)
    return w, height


def place_lockup(base, x, y, width, anchor="lt"):
    """The full lockup. Never upscaled past the source raster (512x400)."""
    m = _trimmed(LOCKUP_PATH)
    width = min(width, m.width)
    h = int(round(width * m.height / m.width))
    m = m.resize((width, h), Image.LANCZOS)
    px = x if anchor[0] == "l" else x - width if anchor[0] == "r" else x - width // 2
    py = y if anchor[1] == "t" else y - h if anchor[1] == "b" else y - h // 2
    base.paste(m, (int(px), int(py)), m)
    return width, h


# ----------------------------------------------------------------- the dial --
def draw_dial(base, cx, cy, radius, plan):
    """The countable engine dial. See the module docstring.

    Segments run clockwise from 12 o'clock. Pillow measures angles clockwise
    from 3 o'clock, so 12 o'clock is -90.
    """
    n = SEGMENTS
    gap_deg = 5.0
    span = 360.0 / n
    thickness = max(3, int(radius * 0.155))
    size = radius * 2

    # Filled and empty segments are separated by STROKE WEIGHT, not by tone,
    # and that is forced, not preferred. Proof, printed by main():
    # #8b5cf6 measures 4.65:1 on this canvas. For an empty-track colour to
    # clear 3:1 against BOTH the canvas and that fill it would have to be
    # simultaneously above 0.160 and below 0.083 in (L + 0.05), which is
    # empty, or else brighter than 13.94:1 against the canvas, which would
    # make the empty slots read as the filled ones. So the empty track is
    # drawn at 35% of the filled thickness in #7d838f, which clears 3:1
    # against the canvas on its own, and the distinction survives greyscale
    # because it is a thickness, not a hue.
    filled = plan["live_engines"]
    empty_thickness = max(2, int(round(thickness * 0.35)))
    for i in range(n):
        a0 = -90.0 + i * span + gap_deg / 2.0
        a1 = -90.0 + (i + 1) * span - gap_deg / 2.0
        if i < filled:
            m = mask_arc(size, thickness, a0, a1)
            paste_flat(base, m, (cx - radius, cy - radius), AC)
        else:
            inset = (thickness - empty_thickness) // 2
            m = mask_arc(size - inset * 2, empty_thickness, a0, a1)
            paste_flat(base, m, (cx - radius + inset, cy - radius + inset), T3)

    # Outer form. Managed gets a continuous ring, Enterprise gets discrete pips.
    if plan["outer"] == "ring":
        r2 = int(radius * 1.30)
        m = mask_ring(r2 * 2, max(3, int(radius * 0.085)))
        paste_flat(base, m, (cx - r2, cy - r2), ACT)
    elif plan["outer"] == "pips":
        import math
        r2 = radius * 1.32
        total = plan["live_engines"] + plan["reserved"]
        pr = max(3, int(radius * 0.105))
        for i in range(total):
            ang = math.radians(-90.0 + i * (360.0 / total))
            px = cx + r2 * math.cos(ang)
            py = cy + r2 * math.sin(ang)
            if i < plan["live_engines"]:
                m = mask_disc(pr * 2)
                paste_flat(base, m, (int(px - pr), int(py - pr)), ACT)
            else:
                m = mask_ring(pr * 2, max(2, int(pr * 0.42)))
                paste_flat(base, m, (int(px - pr), int(py - pr)), ACT)

    # Centre numeral: the live engine count, again.
    f = font("ExtraBold", int(radius * 0.86))
    d = ImageDraw.Draw(base)
    text(d, (cx, cy + radius * 0.02), str(plan["live_engines"]), f, T, anchor="mm")
    fl = font("SemiBold", max(9, int(radius * 0.155)))
    text(d, (cx, cy + radius * 0.50), "ENGINES", fl, T3, anchor="mm", tracking=0.16)


# ------------------------------------------------------------ compositions --
def render_square(plan, size, use_lockup):
    """Product image. Square. Must survive being shown at roughly 40 pixels,
    so it carries the dial, the tier name, the price and one short fact, and
    nothing else. No sentence, no CTA, no decoration."""
    img = Image.new("RGB", (size, size), hexs(BG))
    d = ImageDraw.Draw(img)
    u = size / 1024.0   # scale unit, geometry authored at 1024

    # Brand art, top left, clear space >= the mark's own height on every side.
    if use_lockup:
        place_lockup(img, int(96 * u), int(96 * u), int(210 * u))
    else:
        place_mark(img, int(96 * u), int(96 * u), int(78 * u))

    draw_dial(img, size // 2, int(452 * u), int(178 * u), plan)

    name_f = fit_font([plan["label"]], "ExtraBold", int(96 * u), size - int(150 * u))
    text(d, (size // 2, int(742 * u)), plan["label"], name_f, T, anchor="mm")

    price_f = fit_font([plan["price_glyph"]], "Bold", int(54 * u), size - int(170 * u))
    text(d, (size // 2, int(826 * u)), plan["price_glyph"], price_f, ACT, anchor="mm")

    fact_f = fit_font([plan["fact"]], "Medium", int(32 * u), size - int(150 * u))
    text(d, (size // 2, int(898 * u)), plan["fact"], fact_f, T2, anchor="mm")
    return img


def render_promo(plan, w, h):
    """Direct promotion. There is room for a CTA and a fuller line here, and
    unlike the product image this one is allowed to be read rather than
    recognised."""
    img = Image.new("RGB", (w, h), hexs(BG))
    d = ImageDraw.Draw(img)
    u = min(w, h) / 1080.0

    pad = int(78 * u)
    place_lockup(img, pad, pad, min(int(240 * u), 512))

    tall = h > w * 1.05
    wide = w > h * 1.4

    if wide:
        dial_r = int(min(h * 0.30, w * 0.15))
        dial_cx = int(w * 0.76)
        dial_cy = int(h * 0.52)
        col_x = pad
        col_w = int(w * 0.56)
    else:
        dial_r = int(min(w, h) * 0.155)
        dial_cx = w // 2
        dial_cy = int(h * (0.44 if tall else 0.42))
        col_x = pad
        col_w = w - pad * 2

    draw_dial(img, dial_cx, dial_cy, dial_r, plan)

    if wide:
        y = int(h * 0.30)
        name_f = fit_font([plan["label"]], "ExtraBold", int(96 * u), col_w)
        text(d, (col_x, y), plan["label"], name_f, T, anchor="lt")
        y += int(name_f.size * 1.12)
        price_f = fit_font([plan["price_glyph"]], "Bold", int(50 * u), col_w)
        text(d, (col_x, y + int(10 * u)), plan["price_glyph"], price_f, ACT, anchor="lt")
        y += int(price_f.size * 1.5)
        fact_f = font("Medium", int(30 * u))
        for i, ln in enumerate(wrap(plan["fact"], fact_f, col_w)):
            text(d, (col_x, y + i * int(fact_f.size * 1.3)), ln, fact_f, T2, anchor="lt")
        cta_x, cta_y, cta_anchor = col_x, h - pad, "l"
    else:
        y = int(h * (0.66 if tall else 0.63))
        name_f = fit_font([plan["label"]], "ExtraBold", int(92 * u), col_w)
        text(d, (w // 2, y), plan["label"], name_f, T, anchor="mm")
        y += int(name_f.size * 0.92)
        price_f = fit_font([plan["price_glyph"]], "Bold", int(48 * u), col_w)
        text(d, (w // 2, y), plan["price_glyph"], price_f, ACT, anchor="mm")
        y += int(price_f.size * 1.30)
        fact_f = font("Medium", int(29 * u))
        for i, ln in enumerate(wrap(plan["fact"], fact_f, col_w)):
            text(d, (w // 2, y + i * int(fact_f.size * 1.3)), ln, fact_f, T2, anchor="mm")
        cta_x, cta_y, cta_anchor = w // 2, h - pad, "m"

    # CTA pill. White on ACS, which is the only pairing measured to clear AA.
    # Managed and Enterprise are sales assisted and have no checkout link by
    # design (site.js:619 says so explicitly). Their CTA has to match COPY.md,
    # which sends both to contact rather than to a plan page. Sending a
    # Managed buyer to a self-serve page is a dead end.
    sales_assisted = plan["key"] in ("managed", "enterprise")
    cta = "Talk to us at getbrandgeo.com" if sales_assisted \
        else "See your plan at getbrandgeo.com"
    cf = font("SemiBold", int(28 * u))
    tw = cf.getlength(cta)
    pw = int(tw + 62 * u)
    ph = int(cf.size * 2.15)
    px = cta_x if cta_anchor == "l" else cta_x - pw // 2
    py = cta_y - ph
    paste_flat(img, mask_rrect(pw, ph, ph // 2), (int(px), int(py)), ACS)
    text(d, (px + pw / 2, py + ph / 2), cta, cf, WHITE, anchor="mm")
    return img


# ------------------------------------------------------------------- sizes --
# Every dimension is justified in ../README.md against a named source.
SQUARE_SPECS = [
    ("stripe", 1024),    # UNVERIFIED pixel spec, see README
    ("gbp", 1440),       # 2x Google's documented 720x720 recommendation
]
PROMO_SPECS = [
    ("1080x1080", 1080, 1080),
    ("1080x1350", 1080, 1350),
    ("1200x630", 1200, 630),
    ("1600x900", 1600, 900),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = []

    for plan in PLAN_FACTS:
        for surface, size in SQUARE_SPECS:
            # Squares are product images shown small. The lockup's wordmark
            # would be sub-pixel there, so the mark alone carries the brand.
            img = render_square(plan, size, use_lockup=False)
            name = f"{surface}-{plan['key']}-{size}x{size}.png"
            img.save(os.path.join(OUT, name), optimize=True)
            manifest.append({"file": name, "plan": plan["key"], "surface": surface,
                             "w": size, "h": size, "brand": "mark"})
        for tag, w, h in PROMO_SPECS:
            img = render_promo(plan, w, h)
            name = f"promo-{plan['key']}-{tag}.png"
            img.save(os.path.join(OUT, name), optimize=True)
            manifest.append({"file": name, "plan": plan["key"], "surface": "promo",
                             "w": w, "h": h, "brand": "lockup"})

    with open(os.path.join(HERE, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)

    print(f"rendered {len(manifest)} images into {OUT}")

    print("\n-- measured contrast, sRGB relative luminance --")
    pairs = [
        ("text #e8e9ed", T, "canvas #0a0b0e", BG, 4.5),
        ("text2 #9ba1ac", T2, "canvas #0a0b0e", BG, 4.5),
        ("text3 #7d838f", T3, "canvas #0a0b0e", BG, 4.5),
        ("accent-text #a78bfa", ACT, "canvas #0a0b0e", BG, 4.5),
        ("white #ffffff", WHITE, "cta fill #7c3aed", ACS, 4.5),
        ("filled segment #8b5cf6", AC, "canvas #0a0b0e", BG, 3.0),
        ("empty track #7d838f", T3, "canvas #0a0b0e", BG, 3.0),
        ("outer ring / pips #a78bfa", ACT, "canvas #0a0b0e", BG, 3.0),
    ]
    ok = True
    for fg_n, fg, bg_n, bg, floor in pairs:
        r = contrast(fg, bg)
        good = r >= floor
        ok = ok and good
        print(f"  {r:6.2f}:1  floor {floor}  {'PASS' if good else 'FAIL'}"
              f"   {fg_n} on {bg_n}")

    print("\n-- why filled vs empty is a stroke weight and not a tone --")
    kbg = lum(BG) + 0.05
    kac = lum(AC) + 0.05
    print(f"  canvas L+0.05 = {kbg:.5f}, filled #8b5cf6 L+0.05 = {kac:.5f}")
    print(f"  an empty-track colour clearing 3:1 on both would need "
          f"L+0.05 >= {3 * kbg:.5f} and <= {kac / 3:.5f}. Empty interval.")
    print(f"  the only alternative is brighter than {3 * kac / kbg:.2f}:1 against "
          f"the canvas, which would outshine the filled segments.")
    print("  so the empty track is 35% of the filled thickness. Greyscale safe.")

    print("\n-- what is NOT used --")
    print(f"  #8b5cf6 as a text colour: never. White on it measures "
          f"{contrast(WHITE, AC)}:1 and fails AA.")
    print(f"\ncontrast gate: {'PASS' if ok else 'FAIL'}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
