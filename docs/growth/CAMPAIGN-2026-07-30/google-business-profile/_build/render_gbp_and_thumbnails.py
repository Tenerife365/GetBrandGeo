"""
CAMPAIGN-2026-07-30: Google Business Profile post images and YouTube Shorts
thumbnails.

Foundation is `docs/growth/grok-launch/images/_build/render_launch_images.py`:
Pillow only, 8x supersampled shape masks downsampled with Lanczos, real Inter
from `_shared/fonts/`. No matplotlib, no cairosvg, no ImageMagick, none of which
are installed here.

Two output sets, both written outside this folder:

  ../                     four 1200x900 (4:3) GBP post images
  ../../youtube/thumbnails/  nine 1280x720 (16:9) Shorts thumbnails

Every number on a GBP image is read from `brandgeo-dashboard/src/lib/planConfig.ts`
and `brandgeo-dashboard/src/pages/Account.tsx`. Every word on a thumbnail is
drawn from the on-screen text of the short it belongs to, in
`../../youtube/shorts/<runid>-youtube-NOTES.md`. No claim on any image is new.

Run: python render_gbp_and_thumbnails.py
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
GBP_OUT = os.path.abspath(os.path.join(HERE, ".."))
THUMB_OUT = os.path.abspath(os.path.join(HERE, "..", "..", "youtube", "thumbnails"))
SHORTS = os.path.abspath(os.path.join(HERE, "..", "..", "youtube", "shorts"))
SHARED = os.path.abspath(os.path.join(HERE, "..", "..", "_shared"))
FONTS = os.path.join(SHARED, "fonts")
LOCKUP = os.path.join(SHARED, "logo", "brandgeo-lockup-dark-transparent-w512.png")

SS = 8  # supersample factor for shape masks

# ---------------------------------------------------------------- palette ---
# docs/growth/channel-specs-2026-07-29.md, via the campaign brief section 5.
BG = "#0a0b0e"      # canvas
S = "#101116"       # card surface
S2 = "#16171e"      # raised surface
BD = "#23242b"      # hairline border
BD2 = "#32333c"     # stronger border
AC = "#8b5cf6"      # violet, FILL ONLY, never a text colour
ACS = "#7c3aed"     # CTA fill
ACT = "#a78bfa"     # accent WORDS
T = "#e8e9ed"       # primary text
T2 = "#9ba1ac"      # secondary text
T3 = "#7d838f"      # muted text
OK = "#34d399"      # status ok

GRAD = [(0.00, "#6366F1"), (0.55, "#8B5CF6"), (1.00, "#7C3AED")]


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
    return (hi + 0.05) / (lo + 0.05)


def grad_at(t):
    t = min(1.0, max(0.0, t))
    for i in range(len(GRAD) - 1):
        t0, c0 = GRAD[i]
        t1, c1 = GRAD[i + 1]
        if t0 <= t <= t1:
            f = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            a, b = hexs(c0), hexs(c1)
            return tuple(round(a[j] + (b[j] - a[j]) * f) for j in range(3))
    return hexs(GRAD[-1][1])


def grad_image(w, h, vertical=False):
    img = Image.new("RGB", (w, h))
    px = img.load()
    if vertical:
        for y in range(h):
            c = grad_at(y / max(1, h - 1))
            for x in range(w):
                px[x, y] = c
    else:
        for x in range(w):
            c = grad_at(x / max(1, w - 1))
            for y in range(h):
                px[x, y] = c
    return img


# ------------------------------------------------------------ shape masks ---
def mask_rrect(w, h, radius):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def mask_ring(size, thickness):
    m = Image.new("L", (size * SS, size * SS), 0)
    d = ImageDraw.Draw(m)
    d.ellipse([0, 0, size * SS - 1, size * SS - 1], fill=255)
    t = thickness * SS
    d.ellipse([t, t, size * SS - 1 - t, size * SS - 1 - t], fill=0)
    return m.resize((size, size), Image.LANCZOS)


def mask_check(size, weight):
    n = size * SS
    m = Image.new("L", (n, n), 0)
    d = ImageDraw.Draw(m)
    pts = [(0.24 * n, 0.53 * n), (0.42 * n, 0.71 * n), (0.77 * n, 0.31 * n)]
    d.line(pts, fill=255, width=int(weight * SS), joint="curve")
    r = weight * SS / 2.0
    for x, y in (pts[0], pts[2]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def paste_flat(base, mask, xy, colour):
    layer = Image.new("RGB", mask.size,
                      hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, xy, mask)


def paste_grad(base, mask, xy, vertical=False):
    base.paste(grad_image(mask.size[0], mask.size[1], vertical), xy, mask)


def glow(base, mask, xy, colour, radius, strength=1.0):
    w, h = base.size
    canvas_l = Image.new("L", (w, h), 0)
    canvas_l.paste(mask, xy)
    canvas_l = canvas_l.filter(ImageFilter.GaussianBlur(radius))
    a = np.asarray(canvas_l).astype(np.float32) / 255.0 * strength
    c = np.array(hexs(colour) if isinstance(colour, str) else colour, dtype=np.float32)
    b = np.asarray(base).astype(np.float32)
    base.paste(Image.fromarray(np.clip(b + a[..., None] * c, 0, 255).astype(np.uint8)),
               (0, 0))


def vignette(base, cx, cy, radius, colour=AC, strength=0.16):
    w, h = base.size
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - cx) / radius) ** 2 + ((yy - cy) / radius) ** 2)
    a = np.clip(1.0 - r, 0, 1) ** 2 * strength
    c = np.array(hexs(colour), dtype=np.float32)
    b = np.asarray(base).astype(np.float32)
    base.paste(Image.fromarray(np.clip(b + a[..., None] * c, 0, 255).astype(np.uint8)),
               (0, 0))


def canvas(w, h):
    return Image.new("RGB", (w, h), hexs(BG))


# Every backdrop actually rendered, so contrast can be measured against the
# surface the type really sits on rather than against the raw canvas token. The
# vignette adds violet light to the canvas, which RAISES background luminance
# and therefore LOWERS contrast for light text. Reporting 16.22:1 for #e8e9ed on
# #0a0b0e would be reporting a surface that does not exist on these files.
# Vignette strength. 0.17 was the first value tried and it pushed muted text
# (#7d838f) to 4.35:1 against the brightest violet pixel it produced, which the
# measured check below caught. 0.12 restores 4.62:1 with headroom.
VIG = 0.12

BACKDROPS = []


def record_backdrop(name, w, h, cx, cy, radius, strength):
    BACKDROPS.append((name, w, h, cx, cy, radius, strength))


def backdrop_peak(w, h, cx, cy, radius, strength):
    """The single brightest canvas+vignette pixel actually inside the frame."""
    im = canvas(w, h)
    vignette(im, cx, cy, radius, AC, strength)
    a = np.asarray(im).astype(np.float32)
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    iy, ix = np.unravel_index(int(np.argmax(y)), y.shape)
    return tuple(int(v) for v in a[iy, ix])


# ------------------------------------------------------------------ type ----
_font_cache = {}


def font(weight, size):
    key = (weight, int(size))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(
            os.path.join(FONTS, f"Inter-{weight}.ttf"), int(size))
    return _font_cache[key]


def text(d, xy, s, f, fill, anchor="la", tracking=0.0):
    col = hexs(fill) if isinstance(fill, str) else fill
    if not tracking:
        d.text(xy, s, font=f, fill=col, anchor=anchor)
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
        d.text((x, y), ch, font=f, fill=col, anchor="l" + va)
        x += f.getlength(ch) + step


def tracked_width(s, f, tracking):
    step = tracking * f.size
    return sum(f.getlength(ch) + step for ch in s) - step


def fit_font(lines, weight, start, max_w, floor=14):
    """Largest size at which every line clears max_w. Eyeballed point sizes are
    exactly how a headline ends up running under the artwork."""
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


def block(d, xy, lines, f, fill, leading=1.14, anchor="la", tracking=0.0):
    x, y = xy
    lh = f.size * leading
    for i, ln in enumerate(lines):
        text(d, (x, y + i * lh), ln, f, fill, anchor=anchor, tracking=tracking)
    return y + len(lines) * lh


# --------------------------------------------------------------- lockup -----
_lockup = None
_mark_frac = None


def lockup_asset():
    """The sanctioned stacked lockup, plus the fraction of its height taken by
    the mark alone. Clear space is defined as the mark's own height, so that
    fraction has to be measured rather than guessed: the gap row between the
    mark and the wordmark is found by scanning the alpha channel for a fully
    transparent scanline."""
    global _lockup, _mark_frac
    if _lockup is None:
        im = Image.open(LOCKUP).convert("RGBA")
        im = im.crop(im.getchannel("A").getbbox())
        a = np.asarray(im.getchannel("A"))
        rows = a.max(axis=1)                      # per-scanline max alpha
        empty = np.flatnonzero(rows == 0)
        # first empty band after the top half of the image is the mark/wordmark gap
        gap = [r for r in empty if r > im.height * 0.4]
        mark_h = gap[0] if gap else int(im.height * 0.71)
        _lockup = im
        _mark_frac = mark_h / im.height
    return _lockup, _mark_frac


def place_lockup(base, x, y, width, anchor="lt"):
    """Draw the lockup at `width` px wide. Never upscaled beyond the source
    raster. Returns (x0, y0, x1, y1, clear) where `clear` is the required clear
    space, one mark height, on every side."""
    im, frac = lockup_asset()
    assert width <= im.width, f"lockup upscaled: {width} > source {im.width}"
    h = int(round(width * im.height / im.width))
    r = im.resize((width, h), Image.LANCZOS)
    x0 = x if anchor[0] == "l" else x - width if anchor[0] == "r" else x - width // 2
    y0 = y if anchor[1] == "t" else y - h if anchor[1] == "b" else y - h // 2
    base.paste(r, (int(x0), int(y0)), r)
    return int(x0), int(y0), int(x0) + width, int(y0) + h, int(round(h * frac))


# ------------------------------------------------------------------ save ----
written = []


def save_png(im, out_dir, name):
    p = os.path.join(out_dir, name)
    im.save(p, "PNG", optimize=True)
    written.append(p)
    return p


# ====================================================== product truth =======
# planConfig.ts PLAN_ENGINES / PLAN_PROMPTS / PLAN_COLLECTION_COOLDOWN_HOURS,
# Account.tsx PLAN_TIERS, _prospect_engines.js FULL_ENGINES. Read 2026-07-30.
AUDIT_ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode"]
PRO_ENGINES = [
    ("ChatGPT", False), ("Gemini", False), ("Claude", False),
    ("Perplexity", False), ("Google AI Mode", False),
    ("Grok", True), ("Google AI Overviews", True),
]
LADDER = [
    ("Free", "EUR 0", "1 engine, 5 questions"),
    ("Essentials", "EUR 99", "3 engines, 15 questions"),
    ("Growth", "EUR 299", "5 engines, 35 questions"),
    ("Growth PRO", "EUR 449", "7 engines, 35 questions"),
    ("Managed", "from EUR 1,500", "done for you"),
]

# GBP crops a post image toward square in some surfaces and toward landscape in
# others. The safe area is the intersection of a centred 1:1 crop (x 150..1050)
# and a centred 16:9 crop (y 112..787). Content is kept inside a tighter box.
GBP_W, GBP_H = 1200, 900
SAFE = (150, 112, 1050, 788)          # the crop intersection itself
CONTENT = (180, 140, 1020, 760)       # where anything load-bearing may sit


def _assert_inside(name, box, region=CONTENT):
    x0, y0, x1, y1 = box
    rx0, ry0, rx1, ry1 = region
    assert x0 >= rx0 and y0 >= ry0 and x1 <= rx1 and y1 <= ry1, \
        f"{name} {box} escapes {region}"


class Guard:
    """Occupancy tracker for one canvas.

    The first run of this script asserted only that the CARD sat inside the
    content box, so the headline and the eyebrow ran straight underneath it and
    nothing complained. Every drawn element is registered here instead, with its
    real bounding box, and any overlap is a hard failure.
    """

    def __init__(self, region=CONTENT):
        self.region = region
        self.boxes = []

    def reserve(self, name, box, region=None):
        _assert_inside(name, box, region or self.region)
        for other, ob in self.boxes:
            if (box[0] < ob[2] and ob[0] < box[2]
                    and box[1] < ob[3] and ob[1] < box[3]):
                raise AssertionError(f"{name} {box} overlaps {other} {ob}")
        self.boxes.append((name, tuple(box)))
        return box


def text_box(d, xy, s, f, anchor="la", tracking=0.0):
    """True bounding box of a single drawn string, from the font, not guessed."""
    if tracking:
        w = tracked_width(s, f, tracking)
        bb = d.textbbox(xy, s, font=f, anchor=anchor)
        return (bb[0], bb[1], bb[0] + w, bb[3])
    return d.textbbox(xy, s, font=f, anchor=anchor)


def block_box(d, xy, lines, f, leading=1.14, anchor="la", tracking=0.0):
    x, y = xy
    lh = f.size * leading
    boxes = [text_box(d, (x, y + i * lh), ln, f, anchor, tracking)
             for i, ln in enumerate(lines)]
    return (min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes))


# ========================================================== GBP images ======
def card(im, guard, name, box, rows_fn, radius=18):
    """Opaque surface card with a hairline edge. `rows_fn(card_img, draw, w, h)`
    paints the contents. Registered with the guard before anything is drawn."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    guard.reserve(name, box)
    c = Image.new("RGB", (w, h), hexs(S))
    rows_fn(c, ImageDraw.Draw(c), w, h)
    im.paste(c, (x0, y0), mask_rrect(w, h, radius))
    edge = Image.new("L", (w, h), 0)
    ImageDraw.Draw(edge).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius,
                                           outline=255, width=1)
    paste_flat(im, edge, (x0, y0), BD2)


def engine_rows(names, header, new_flags=None):
    def paint(c, cd, w, h):
        pad = 26
        text(cd, (pad, pad), header, font("SemiBold", 18), T3, tracking=0.13)
        rh = (h - pad * 2 - 34) / len(names)
        for i, nm in enumerate(names):
            is_new = bool(new_flags and new_flags[i])
            my = pad + 34 + rh * i + rh / 2
            ck = 22
            col = ACT if is_new else (OK if new_flags is None else T3)
            paste_flat(c, mask_ring(ck, 2), (pad, int(my - ck / 2)), col)
            paste_flat(c, mask_check(ck, 3), (pad, int(my - ck / 2)), col)
            text(cd, (pad + ck + 14, my), nm, font("Medium", 23),
                 T if (is_new or new_flags is None) else T2, anchor="lm")
            if is_new:
                text(cd, (w - pad, my), "NEW", font("SemiBold", 17), ACT,
                     anchor="rm", tracking=0.12)
            if new_flags is not None and i < len(names) - 1:
                yy = pad + 34 + rh * (i + 1)
                cd.line([(pad, yy), (w - pad, yy)], fill=hexs(BD), width=1)
    return paint


def gbp_frame(eyebrow, vig=(0.86, 0.10), lockup_w=108, col_right=None):
    """Shared GBP chrome: canvas, vignette, lockup top left, eyebrow, footer.

    Returns (image, draw, guard, y_cursor, left_column_right_edge).
    """
    im = canvas(GBP_W, GBP_H)
    vignette(im, GBP_W * vig[0], GBP_H * vig[1], GBP_W * 0.66, AC, VIG)
    record_backdrop(f"gbp/{eyebrow}", GBP_W, GBP_H, GBP_W * vig[0], GBP_H * vig[1],
                    GBP_W * 0.66, VIG)
    d = ImageDraw.Draw(im)
    g = Guard()

    lx0, ly0, lx1, ly1, clear = place_lockup(im, CONTENT[0], CONTENT[1], lockup_w)
    g.reserve("lockup", (lx0, ly0, lx1, ly1))

    # Everything else starts one full mark height below the lockup, which is the
    # clear-space rule expressed as geometry rather than as a comment.
    y = ly1 + clear
    g.reserve("eyebrow", text_box(d, (CONTENT[0], y), eyebrow,
                                  font("SemiBold", 23), tracking=0.16))
    text(d, (CONTENT[0], y), eyebrow, font("SemiBold", 23), ACT, tracking=0.16)
    y += 44

    foot = "getbrandgeo.com"
    g.reserve("footer", text_box(d, (CONTENT[2], CONTENT[3]), foot,
                                 font("Medium", 23), anchor="rb"))
    text(d, (CONTENT[2], CONTENT[3]), foot, font("Medium", 23), T2, anchor="rb")

    return im, d, g, y, (col_right if col_right else CONTENT[2])


def draw_block(d, g, name, xy, lines, f, fill, leading=1.14, tracking=0.0):
    g.reserve(name, block_box(d, xy, lines, f, leading, tracking=tracking))
    return block(d, xy, lines, f, fill, leading=leading, tracking=tracking)


# ---------------------------------------------------------------- 1 of 4 ----
def gbp_1_free_audit():
    CARD = (664, 250, 1020, 640)
    col_r = CARD[0] - 44
    im, d, g, y, _ = gbp_frame("FREE AUDIT", vig=(0.88, 0.18), col_right=col_r)
    colw = col_r - CONTENT[0]

    head = ["Check your domain.", "Under a minute."]
    f = fit_font(head, "Bold", 60, colw)
    y = draw_block(d, g, "headline", (CONTENT[0], y), head, f, T, leading=1.12)

    y += 22
    g.reserve("rule", (CONTENT[0], int(y), CONTENT[0] + 132, int(y) + 7))
    paste_flat(im, mask_rrect(132, 7, 4), (CONTENT[0], int(y)), ACS)
    y += 34

    body = wrap("Five engines, asked the questions your buyers ask. A score, "
                "and a breakdown per engine.", font("Regular", 24), colw)
    y = draw_block(d, g, "body", (CONTENT[0], y), body, font("Regular", 24), T2,
                   leading=1.42)

    draw_block(d, g, "tail", (CONTENT[0], CONTENT[3] - 36),
               ["No card. No commitment."], font("Medium", 25), T)

    card(im, g, "audit card", CARD, engine_rows(AUDIT_ENGINES, "THE AUDIT ASKS"))
    save_png(im, GBP_OUT, "gbp-1-free-audit-1200x900.png")


# ---------------------------------------------------------------- 2 of 4 ----
def gbp_2_essentials():
    im, d, g, y, _ = gbp_frame("ESSENTIALS", vig=(0.12, 0.90))
    colw = CONTENT[2] - CONTENT[0]

    fp = font("ExtraBold", 104)
    g.reserve("price", text_box(d, (CONTENT[0], y), "EUR 99", fp))
    text(d, (CONTENT[0], y), "EUR 99", fp, T)
    px = CONTENT[0] + fp.getlength("EUR 99") + 20
    g.reserve("per", text_box(d, (px, y + 60), "a month", font("Medium", 30)))
    text(d, (px, y + 60), "a month", font("Medium", 30), T2)
    y += fp.size * 1.30

    rows = [("ChatGPT, Gemini and Claude", "3 engines"),
            ("Your own buyer questions", "15 prompts"),
            ("Every answer kept, refreshed", "weekly")]
    rh = 66
    ch = rh * len(rows) + 22

    def paint(c, cd, w, h):
        for i, (lab, val) in enumerate(rows):
            my = 11 + rh * i + rh / 2
            text(cd, (28, my), lab, font("Medium", 27), T, anchor="lm")
            text(cd, (w - 28, my), val, font("SemiBold", 27), ACT, anchor="rm")
            if i < len(rows) - 1:
                cd.line([(28, 11 + rh * (i + 1)), (w - 28, 11 + rh * (i + 1))],
                        fill=hexs(BD), width=1)

    card(im, g, "spec card", (CONTENT[0], int(y), CONTENT[0] + colw, int(y) + ch),
         paint)
    y += ch + 30
    draw_block(d, g, "free note", (CONTENT[0], y),
               ["Free stays free: 1 engine, 5 questions, monthly."],
               font("Regular", 24), T2)
    save_png(im, GBP_OUT, "gbp-2-essentials-1200x900.png")


# ---------------------------------------------------------------- 3 of 4 ----
def gbp_3_growth_pro():
    # Bottom stops short of the footer line, which the guard caught colliding.
    CARD = (596, 172, 1020, 706)
    col_r = CARD[0] - 44
    im, d, g, y, _ = gbp_frame("GROWTH PRO", vig=(0.16, 0.86), col_right=col_r)
    colw = col_r - CONTENT[0]

    f = fit_font(["Seven engines."], "Bold", 56, colw)
    y = draw_block(d, g, "headline", (CONTENT[0], y), ["Seven engines."], f, T,
                   leading=1.12)
    y += 14
    y = draw_block(d, g, "price", (CONTENT[0], y), ["EUR 449 a month."],
                   font("SemiBold", 32), ACT, leading=1.2)
    y += 22
    body = wrap("Grok and Google AI Overviews went live on 29 July 2026.",
                font("Regular", 24), colw)
    draw_block(d, g, "body", (CONTENT[0], y), body, font("Regular", 24), T2,
               leading=1.42)

    tail = wrap("Growth covers the first five, at EUR 299 a month.",
                font("Medium", 25), colw)
    draw_block(d, g, "tail", (CONTENT[0], CONTENT[3] - 36 - 34 * (len(tail) - 1)),
               tail, font("Medium", 25), T, leading=1.34)

    card(im, g, "pro card", CARD,
         engine_rows([n for n, _ in PRO_ENGINES], "MONITORED ON GROWTH PRO",
                     [x for _, x in PRO_ENGINES]))
    save_png(im, GBP_OUT, "gbp-3-growth-pro-1200x900.png")


# ---------------------------------------------------------------- 4 of 4 ----
def gbp_4_ladder():
    im, d, g, y, _ = gbp_frame("PLANS", vig=(0.50, 0.04))
    colw = CONTENT[2] - CONTENT[0]

    head = "Start free. Move when you have data."
    f = fit_font([head], "Bold", 54, colw)
    y = draw_block(d, g, "headline", (CONTENT[0], y), [head], f, T, leading=1.12)
    y += 28

    rh = 56
    ch = rh * len(LADDER) + 20

    def paint(c, cd, w, h):
        for i, (nm, price, note) in enumerate(LADDER):
            my = 10 + rh * i + rh / 2
            text(cd, (28, my), nm, font("SemiBold", 26), T, anchor="lm")
            text(cd, (338, my), note, font("Regular", 22), T2, anchor="lm")
            text(cd, (w - 28, my), price, font("Bold", 26),
                 ACT if nm == "Growth PRO" else T, anchor="rm")
            if i < len(LADDER) - 1:
                cd.line([(28, 10 + rh * (i + 1)), (w - 28, 10 + rh * (i + 1))],
                        fill=hexs(BD), width=1)

    card(im, g, "ladder card", (CONTENT[0], int(y), CONTENT[0] + colw, int(y) + ch),
         paint)
    y += ch + 16
    draw_block(d, g, "tail", (CONTENT[0], y),
               ["No card to start. Cancel anytime."], font("Regular", 24), T2)
    save_png(im, GBP_OUT, "gbp-4-plan-ladder-1200x900.png")


# ====================================================== YouTube thumbs ======
# One entry per short. `lines` is what gets drawn; every word traces to the
# on-screen text of that short, quoted in `claim`. No figure appears on any
# thumbnail, because a figure cannot carry its denominator, date and scope in
# three words.
THUMBS = [
    ("20260729-2200", ["NO CLICK.", "NO REFERRER."],
     "scene 3, 'No click. / No referrer. / No row in your / analytics.'"),
    ("20260729-2318", ["SOMEONE ELSE", "IS THE ANSWER"],
     "scenes 1 and 2, 'Someone is already the default answer in your category.' "
     "/ 'Not the top result. The answer.'"),
    ("20260730-0013", ["ONE PATTERN", "HELD"],
     "scene 2, 'Different cities. Different companies. One pattern held.'"),
    ("20260730-0113", ["RANK FIRST.", "NOT NAMED."],
     "scenes 1 and 6, 'You rank first in Google.' / 'No penalty. No downgrade.'"),
    ("20260730-0216", ["THE EXACT QUESTION", "WE TYPED"],
     "scene 1, 'The exact question we typed:'"),
    ("20260730-0313", ["RUN THE CHECK", "YOURSELF"],
     "scene 10, 'Run the check yourself.'"),
    ("20260730-0413", ["NOT IN", "THE ROOM"],
     "scene 1, 'A shortlist got made this week. You were not in the room.'"),
    ("20260730-0513", ["NAMED,", "NOT RECOMMENDED"],
     "scene 4, 'You can be named and still be the comparison, not the "
     "recommendation.'"),
    ("20260730-0613", ["SAME QUESTION,", "TWO LANGUAGES"],
     "scene 1, 'The same question, asked twice. Once in French. Once in English.'"),
]

TH_W, TH_H = 1280, 720
SHELF_W = 210  # a Shorts thumbnail in a shelf, roughly


def thumbnail(runid, lines, idx):
    im = canvas(TH_W, TH_H)
    # Vignette walks across the set so nine thumbnails in a column do not read
    # as one repeated image.
    vx = 0.18 + 0.66 * (idx % 3) / 2.0
    vy = 0.14 + 0.60 * ((idx // 3) % 3) / 2.0
    vignette(im, TH_W * vx, TH_H * vy, TH_W * 0.62, AC, VIG)
    record_backdrop(f"thumb/{runid}", TH_W, TH_H, TH_W * vx, TH_H * vy,
                    TH_W * 0.62, VIG)
    d = ImageDraw.Draw(im)

    pad = 80
    # Lockup bottom left. Clear space is one mark height on every side, so the
    # bottom margin and the headline floor are both derived from it, not chosen.
    lw = 110
    im_l, frac = lockup_asset()
    lh = int(round(lw * im_l.height / im_l.width))
    clear = int(round(lh * frac))
    ly0 = TH_H - max(pad, clear) - lh
    lx0, ly0, lx1, ly1, clear = place_lockup(im, pad, ly0, lw)
    assert lx0 >= clear and TH_H - ly1 >= clear, "lockup clear space violated"

    rule_h = 12
    top = pad + 30
    # Rule above the headline, violet fill. AC is a fill token, never type.
    paste_flat(im, mask_rrect(150, rule_h, 6), (pad, top), ACS)

    band_top = top + rule_h + 38
    band_bot = ly0 - clear                   # headline may not cross this
    colw = TH_W - pad * 2
    lead = 1.04

    # Fit on BOTH axes. Fitting on width alone is what put the headline through
    # the logo on the first run of this script.
    size_w = fit_font(lines, "ExtraBold", 176, colw).size
    size_h = int((band_bot - band_top) / (lead * len(lines)))
    f = font("ExtraBold", min(size_w, size_h))
    total = f.size * lead * len(lines)
    ty = band_top + (band_bot - band_top - total) / 2
    assert ty >= band_top - 0.5 and ty + total <= band_bot + 0.5, (
        f"{runid}: headline {int(ty)}..{int(ty + total)} outside "
        f"{band_top}..{band_bot}")
    block(d, (pad, ty), lines, f, T, leading=lead)

    name = f"thumb-{runid}-youtube-1280x720.png"
    save_png(im, THUMB_OUT, name)
    return name, f.size


# --------------------------------------------------------------- legibility -
def cap_height_px(f):
    """Measured cap height of Inter at this size, from a rendered 'H'."""
    probe = Image.new("L", (f.size * 3, f.size * 3), 0)
    ImageDraw.Draw(probe).text((f.size, f.size), "H", font=f, fill=255)
    bb = probe.getbbox()
    return bb[3] - bb[1]


def shelf_legibility(path, f):
    """A thumbnail is seen at about 210 px wide. Two things are checked at that
    size, not at full size:

      1. cap height in shelf pixels. Below about 10 px a capital stops being
         resolvable on a phone shelf.
      2. that the type still separates from the canvas after Lanczos
         downsampling. If strokes wash into the background the luminance spread
         inside the headline band collapses, so the 5th-to-95th percentile
         spread of the downsampled band is measured directly.
    """
    im = Image.open(path).convert("RGB")
    scale = SHELF_W / im.width
    small = im.resize((SHELF_W, int(round(im.height * scale))), Image.LANCZOS)
    a = np.asarray(small).astype(np.float32)
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    band = y[int(0.16 * small.height):int(0.70 * small.height), :]
    p5, p95 = np.percentile(band, 5), np.percentile(band, 95)
    return cap_height_px(f) * scale, p95 - p5


# ------------------------------------------------------------------ main ----
def report_contrast():
    pairs = [
        ("headline / primary text on canvas", T, BG),
        ("secondary text on canvas", T2, BG),
        ("muted text on canvas", T3, BG),
        ("accent text on canvas", ACT, BG),
        ("primary text on card surface", T, S),
        ("secondary text on card surface", T2, S),
        ("muted text on card surface", T3, S),
        ("accent text on card surface", ACT, S),
        ("ok tick on card surface", OK, S),
        ("secondary text on raised surface", T2, S2),
    ]
    print("\ncontrast, sRGB relative luminance, computed not eyeballed:")
    worst = 99.0
    for label, fg, bg in pairs:
        r = contrast(fg, bg)
        worst = min(worst, r)
        print(f"  {label:<38} {fg} on {bg}  {r:6.2f}:1  "
              f"{'PASS' if r >= 4.5 else 'FAIL'}")
    print(f"  lowest measured ratio: {worst:.2f}:1  (AA body floor 4.5:1)")
    print(f"  white on accent fill {AC}: {contrast('#ffffff', AC):.2f}:1 "
          f"-- which is why {AC} is a FILL here and never a text colour")
    assert worst >= 4.5

    # Against the real surface: canvas plus the violet vignette actually drawn.
    peak = (0, 0, 0)
    peak_src = None
    for name, w, h, cx, cy, r, st in BACKDROPS:
        p = backdrop_peak(w, h, cx, cy, r, st)
        if lum(p) > lum(peak):
            peak, peak_src = p, name
    print(f"\nmeasured against the rendered backdrop, not the token:")
    print(f"  brightest canvas pixel across all 13 files: rgb{peak} "
          f"(on {peak_src}), vs the {BG} token")
    worst2 = 99.0
    for label, fg in (("primary text", T), ("secondary text", T2),
                      ("muted text", T3), ("accent text", ACT)):
        r = contrast(fg, peak)
        worst2 = min(worst2, r)
        print(f"  {label:<38} {fg} on rgb{peak}  {r:6.2f}:1  "
              f"{'PASS' if r >= 4.5 else 'FAIL'}")
    print(f"  lowest ratio on the real surface: {worst2:.2f}:1")
    assert worst2 >= 4.5, "vignette pushed a text colour below AA"


def main():
    os.makedirs(GBP_OUT, exist_ok=True)
    os.makedirs(THUMB_OUT, exist_ok=True)

    # Inter has to actually carry every glyph drawn. A missing glyph renders as
    # a blank box, which is invisible to every other check in this file.
    for ch in "EUR0123456789.,":
        probe = Image.new("L", (200, 200), 0)
        ImageDraw.Draw(probe).text((40, 40), ch, font=font("Bold", 80), fill=255)
        assert probe.getbbox() is not None, f"Inter has no glyph for {ch!r}"

    gbp_1_free_audit()
    gbp_2_essentials()
    gbp_3_growth_pro()
    gbp_4_ladder()

    print("\nGBP images, 1200x900 (4:3):")
    print(f"  crop-safe area used: x {SAFE[0]}..{SAFE[2]}, y {SAFE[1]}..{SAFE[3]} "
          f"({SAFE[2] - SAFE[0]}x{SAFE[3] - SAFE[1]}), the intersection of a centred")
    print("  1:1 crop and a centred 16:9 crop. Content box is tighter: "
          f"x {CONTENT[0]}..{CONTENT[2]}, y {CONTENT[1]}..{CONTENT[3]}.")
    for p in written:
        im = Image.open(p)
        print(f"  {os.path.basename(p):<40} {im.width}x{im.height}  "
              f"{os.path.getsize(p) / 1024:7.1f} KB")

    thumbs = []
    for i, (runid, lines, _claim) in enumerate(THUMBS):
        name, size = thumbnail(runid, lines, i)
        thumbs.append((runid, name, size, lines))

    print(f"\nthumbnails, 1280x720 (16:9), legibility measured at {SHELF_W} px shelf width:")
    worst_cap, worst_spread = 999.0, 999.0
    for runid, name, size, lines in thumbs:
        p = os.path.join(THUMB_OUT, name)
        cap, spread = shelf_legibility(p, font("ExtraBold", size))
        worst_cap = min(worst_cap, cap)
        worst_spread = min(worst_spread, spread)
        words = sum(len(ln.split()) for ln in lines)
        print(f"  {name:<44} {words} words  set {size}px  "
              f"cap at shelf {cap:5.1f}px  band spread {spread:5.1f}/255")
    print(f"  worst shelf cap height: {worst_cap:.1f} px  (floor 10 px)")
    print(f"  worst headline band luminance spread: {worst_spread:.1f}/255 (floor 60)")
    assert worst_cap >= 10.0
    assert worst_spread >= 60.0

    report_contrast()
    print(f"\nwrote {len(written)} files")


if __name__ == "__main__":
    main()
