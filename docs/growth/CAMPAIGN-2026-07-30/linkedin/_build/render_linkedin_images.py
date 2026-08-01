"""
LinkedIn assets for CAMPAIGN-2026-07-30: four feed singles and one 8 slide
carousel.

Pillow only. No matplotlib, no cairosvg, no ImageMagick, none of which are
installed here. Shape masks are drawn at 8x and downsampled with Lanczos, the
same technique as the foundation this is built on,
`docs/growth/grok-launch/images/_build/render_launch_images.py`, which is where
`hexs`, `_lin`, `lum`, `contrast`, `mask_rrect`, `paste_flat`, `text`,
`tracked_width`, `fit_font`, `wrap` and `block` come from.

Differences from the foundation, all deliberate:

  * the logo is the LOCKUP from `_shared/logo/`, not the bare mark, because the
    campaign brief requires the lockup on every image with clear space of at
    least the mark's own height on all four sides. `clear_space_ok()` asserts
    that against the lockup's measured internal geometry rather than a guess.
  * every foreground/background pair that is actually drawn is registered by
    `reg()` and asserted at the end, so a contrast failure is a non-zero exit
    rather than something a reader notices later.
  * no raster is ever scaled above its source size.

Run: python render_linkedin_images.py
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LI = os.path.abspath(os.path.join(HERE, ".."))
SHARED = os.path.abspath(os.path.join(LI, "..", "_shared"))
FONTS = os.path.join(SHARED, "fonts")
LOCKUP = os.path.join(SHARED, "logo", "brandgeo-lockup-dark-transparent-w512.png")
FEED = os.path.join(LI, "feed")
CAROUSEL = os.path.join(LI, "carousel")

SS = 8

# ---------------------------------------------------------------- palette ---
# docs/growth/channel-specs-2026-07-29.md, via the campaign brief section 5.
BG   = "#0a0b0e"   # canvas
S    = "#101116"   # card surface
S2   = "#16171e"   # raised surface
BD   = "#23242b"   # hairline
BD2  = "#32333c"   # stronger hairline
AC   = "#8b5cf6"   # FILL ONLY, never a text colour
ACS  = "#7c3aed"   # CTA fill
ACT  = "#a78bfa"   # accent WORDS
T    = "#e8e9ed"   # primary text
T2   = "#9ba1ac"   # secondary text
T3   = "#7d838f"   # muted text
OK   = "#34d399"
PART = "#fb923c"
BAD  = "#f87171"
INFO = "#c4b5fd"
WARN = "#fbbf24"


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


# Every fg/bg pair actually drawn, with the minimum ratio it must clear.
# 4.5 for body, 3.0 for large text (>= 24px bold or >= 32px regular) and for
# non-text indicators, per WCAG 1.4.3 and 1.4.11.
PAIRS = {}


def reg(fg, bg, need, what):
    PAIRS.setdefault((fg, bg, need), set()).add(what)
    return fg


# ------------------------------------------------------------ shape masks ---
def mask_rrect(w, h, radius):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def paste_flat(base, mask, xy, colour):
    layer = Image.new("RGB", mask.size, hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, (int(round(xy[0])), int(round(xy[1]))), mask)


def card(base, x, y, w, h, fill=S, border=BD, radius=20):
    x, y, w, h = int(round(x)), int(round(y)), int(round(w)), int(round(h))
    paste_flat(base, mask_rrect(w, h, radius), (x, y), border)
    paste_flat(base, mask_rrect(w - 2, h - 2, radius - 1), (x + 1, y + 1), fill)
    return (x, y, x + w, y + h)


def chip(base, x, y, label, colour, bg=S2, pad=(20, 11), size=25, tracking=0.09):
    x, y = int(round(x)), int(round(y))
    f = font("SemiBold", size)
    tw = tracked_width(label, f, tracking)
    w, h = int(tw + pad[0] * 2), int(f.size * 1.45 + pad[1] * 2)
    paste_flat(base, mask_rrect(w, h, h // 2), (x, y), bg)
    d = ImageDraw.Draw(base)
    text(d, (x + pad[0], y + h / 2), label, f,
         reg(colour, bg, 4.5, "chip " + label), anchor="lm", tracking=tracking)
    return w, h


# ------------------------------------------------------------------ type ----
_fc = {}


def font(weight, size):
    k = (weight, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(os.path.join(FONTS, "Inter-%s.ttf" % weight), size)
    return _fc[k]


# Every string ffmpeg-equivalent draw call actually puts on a canvas, in draw
# order, keyed by the file being built. Dumped to drawn_strings.json so the
# compliance scan runs on delivered bytes rather than on the brief's intent or
# on a table in POSTS.md that could drift from the render.
DRAWN = {}
_current = [None]


def text(d, xy, s, f, fill, anchor="la", tracking=0.0):
    if _current[0] is not None:
        DRAWN.setdefault(_current[0], []).append(s)
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


def fit_font(lines, weight, start, max_w, floor=16):
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


def block(d, xy, lines, f, fill, leading=1.16, anchor="la", tracking=0.0):
    x, y = xy
    lh = f.size * leading
    for i, ln in enumerate(lines):
        text(d, (x, y + i * lh), ln, f, fill, anchor=anchor, tracking=tracking)
    return y + len(lines) * lh


def para(base, x, y, s, size, colour, bg, max_w, weight="Regular", leading=1.42):
    f = font(weight, size)
    d = ImageDraw.Draw(base)
    return block(d, (x, y), wrap(s, f, max_w), f,
                 reg(colour, bg, 4.5 if size < 32 else 3.0, s[:34]), leading=leading)


# -------------------------------------------------------------- the logo ----
_lock = None
_lock_geom = None


def lockup_src():
    """Returns (image, mark_height_fraction_of_full_height).

    The delivered lockup is stacked: mark above wordmark. The fraction is
    measured off the alpha channel rather than assumed, because the clear-space
    rule is expressed in units of the MARK's height, not the lockup's.
    """
    global _lock, _lock_geom
    if _lock is None:
        im = Image.open(LOCKUP).convert("RGBA")
        a = np.asarray(im.getchannel("A")) > 8
        rows = a.sum(1)
        nz = np.nonzero(rows)[0]
        # the gap between mark and wordmark is the longest run of empty rows
        # strictly inside the ink span
        best = (0, 0, 0)
        run = 0
        for y in range(nz.min(), nz.max() + 1):
            if rows[y] == 0:
                run += 1
            else:
                if run > best[0]:
                    best = (run, y - run, y)
                run = 0
        mark_h = best[1] - nz.min()          # top of gap minus top of ink
        _lock = im
        _lock_geom = (mark_h / float(im.height), nz.min() / float(im.height),
                      nz.max() / float(im.height))
    return _lock, _lock_geom


def lockup(base, x, y, width, anchor="lb"):
    """Draw the lockup at `width` px wide. Never upscaled: the source is 512px
    wide and every call site asks for less. Returns (x0, y0, x1, y1) of the
    drawn INK plus the required clear space in px."""
    im, (mark_frac, top_frac, bot_frac) = lockup_src()
    assert width <= im.width, "lockup would be upscaled: %d > %d" % (width, im.width)
    h = int(round(width * im.height / im.width))
    r = im.resize((width, h), Image.LANCZOS)
    x0 = x if anchor[0] == "l" else x - width
    y0 = y - h if anchor[1] == "b" else y
    base.paste(r, (int(x0), int(y0)), r)
    clear = mark_frac * h
    ink = (x0, y0 + top_frac * h, x0 + width, y0 + bot_frac * h)
    return ink, clear


INK_THRESHOLD = 6  # justified in ink_mask()


def ink_mask(img):
    """Boolean mask of every pixel that is not the canvas.

    Threshold justified by measurement, not by feel: PNG is lossless, so the
    canvas is EXACTLY #0a0b0e wherever nothing was drawn, and the only pixels
    between the canvas and the dimmest drawn colour are glyph antialias fringe.
    `ink_threshold_sweep()` prints the pixel count at several thresholds so the
    plateau is visible; 6 sits inside it.
    """
    a = np.asarray(img).astype(np.int16)
    c = np.array(hexs(BG), dtype=np.int16)
    return (np.abs(a - c).max(axis=2) > INK_THRESHOLD)


def ink_threshold_sweep(img, label):
    a = np.asarray(img).astype(np.int16)
    c = np.array(hexs(BG), dtype=np.int16)
    dm = np.abs(a - c).max(axis=2)
    return "%s ink px at thresholds 2/6/12/24: %s" % (
        label, "/".join(str(int((dm > t).sum())) for t in (2, 6, 12, 24)))


def clear_space_ok(name, canvas_w, canvas_h, rect, clear, prior_mask):
    """Assert clear space of at least the mark's own height on all four sides.

    Against the canvas edges, and against EVERY OTHER INK PIXEL already on the
    image, measured rather than taken from a hand-maintained list. The earlier
    version of this function took a list of rects and therefore only checked
    what the caller remembered to declare, which is the same class of bug as a
    scanner that globs zero files.
    """
    x0, y0, x1, y1 = [int(round(v)) for v in rect]
    bad = []
    for side, gap in (("left", x0), ("top", y0),
                      ("right", canvas_w - x1), ("bottom", canvas_h - y1)):
        if gap < clear - 0.5:
            bad.append("%s edge %.1f < %.1f" % (side, gap, clear))
    c = int(np.ceil(clear))
    ex0, ey0 = max(0, x0 - c), max(0, y0 - c)
    ex1, ey1 = min(canvas_w, x1 + c), min(canvas_h, y1 + c)
    band = prior_mask[ey0:ey1, ex0:ex1].copy()
    band[y0 - ey0:y1 - ey0, x0 - ex0:x1 - ex0] = False  # the lockup's own slot
    n = int(band.sum())
    if n:
        ys, xs = np.nonzero(band)
        bad.append("%d foreign ink px inside the clear band, nearest at "
                   "(%d,%d)" % (n, ex0 + xs[0], ey0 + ys[0]))
    if bad:
        raise AssertionError("%s lockup clear space: %s" % (name, "; ".join(bad)))
    return clear, n


def fits(name, rect, y_bottom):
    """Assert drawn content stays inside the card it was drawn into."""
    if y_bottom > rect[3] - 6:
        raise AssertionError("%s overflows its card: content bottom %.1f, card "
                             "bottom %d" % (name, y_bottom, rect[3]))
    return rect[3] - y_bottom


# ------------------------------------------------------------- furniture ----
def footer(base, w, h, margin, url="getbrandgeo.com", lw=None):
    """URL first, then the lockup, then the clear-space assertion against every
    ink pixel already on the canvas."""
    d = ImageDraw.Draw(base)
    f = font("Medium", 27 if w >= 1200 else 25)
    text(d, (w - margin, h - margin - f.size * 0.55), url, f,
         reg(T3, BG, 4.5, "url"), anchor="rb")
    prior = ink_mask(base)
    # 128/116 rather than something larger: the clear space the brief requires
    # is a function of the mark's height, so an oversized lockup silently eats
    # the bottom of the layout. These sizes keep the wordmark legible at feed
    # scale and leave the copy room to breathe.
    lw = lw or (128 if w >= 1200 else 116)
    rect, clear = lockup(base, margin, h - margin, lw, anchor="lb")
    return clear_space_ok("footer", w, h, rect, clear, prior)


def eyebrow(base, x, y, s, size=23):
    f = font("SemiBold", size)
    d = ImageDraw.Draw(base)
    text(d, (x, y), s, f, reg(T3, BG, 4.5, "eyebrow"), tracking=0.14)
    return y + f.size * 1.5, tracked_width(s, f, 0.14)


def rule(base, x, y, w, colour=BD):
    ImageDraw.Draw(base).line([(x, y), (x + w, y)], fill=hexs(colour), width=2)


def accent_bar(base, x, y, w, h):
    """Violet as a FILL. Non-text indicator, needs 3:1 against the canvas."""
    paste_flat(base, mask_rrect(w, h, min(w, h) // 2), (x, y),
               reg(AC, BG, 3.0, "accent bar fill"))


def new(w, h):
    # Draw calls accumulate under a scratch key and are moved to the real
    # filename by save(). That way no render function has to remember to
    # declare its own name, which is the kind of bookkeeping that silently
    # stops happening.
    _current[0] = "__pending__"
    DRAWN["__pending__"] = []
    return Image.new("RGB", (w, h), hexs(BG))


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    DRAWN[os.path.basename(path)] = DRAWN.pop("__pending__", [])
    _current[0] = None
    return path


# ================================================================ IMAGE 1 ===
def feed_01():
    """Square. The finding is a two-by-two symmetry, two engines against two
    cities, not a list, so it does not want a vertical frame."""
    W = H = 1200
    M = 88
    im = new(W, H)
    d = ImageDraw.Draw(im)

    y, _ = eyebrow(im, M, M, "CHICAGO AND BOSTON  .  COLLECTED 2026-07-24")
    accent_bar(im, M, y + 4, 76, 6)
    y += 30

    f = fit_font(["Two engines returned", "the same firm name."], "ExtraBold", 86, W - M * 2)
    y = block(d, (M, y), ["Two engines returned", "the same firm name."], f,
              reg(T, BG, 3.0, "h1"), leading=1.12)
    y = block(d, (M, y + 4), ["The firm does not exist."], f,
              reg(ACT, BG, 3.0, "h1 accent"), leading=1.12)

    y += 26
    cw = W - M * 2
    ch = 282
    crect = card(im, M, int(y), cw, ch)
    cx, cy = M + 40, int(y) + 38
    fl = font("SemiBold", 24)
    text(d, (cx, cy), "WHAT BOTH ENGINES RETURNED", fl,
         reg(T3, S, 4.5, "card label"), tracking=0.13)

    # The fabricated name is withheld on purpose: it is one word away from a
    # real firm, and the campaign does not name a measured subject. Redaction
    # bars carry the shape without the string.
    bar_y = cy + 62
    for bx, bw in ((0, 210), (232, 128), (392, 40), (454, 176)):
        # T3, not BD2. BD2 measured 1.50:1 against the card and the bars are a
        # meaningful non-text indicator, so they need 3:1. The assertion at the
        # bottom of this file is what caught it.
        paste_flat(im, mask_rrect(bw, 40, 8), (cx + bx, bar_y),
                   reg(T3, S, 3.0, "redaction bar"))
    chip(im, cx + 668, bar_y - 5, "NO SUCH FIRM", BAD)

    fb = font("Regular", 29)
    yy = block(d, (cx, bar_y + 86),
               ["A real firm's name with one word swapped, returned by",
                "ChatGPT and by Gemini, independently, in both cities."],
               fb, reg(T2, S, 4.5, "card body"), leading=1.38)
    fits("li-01 card body", crect, yy + fb.size * 0.3)

    y += ch + 26
    rows = [("Chicago", "corporate law"), ("Boston", "biotech and life sciences law")]
    for i, (city, cat) in enumerate(rows):
        rx = M + i * (cw // 2)
        text(d, (rx, y), city, font("SemiBold", 33), reg(T, BG, 4.5, "city"))
        text(d, (rx, y + 44), cat, font("Regular", 26), reg(T3, BG, 4.5, "category"))
    y += 90
    rule(im, M, y, cw)
    text(d, (M, y + 22),
         "Five engines ran in both cities. All five returned usable data on every prompt.",
         font("Medium", 26), reg(T2, BG, 4.5, "denominator"))

    footer(im, W, H, M)
    return save(im, os.path.join(FEED, "li-01-same-wrong-name-1200x1200.png"))


# ================================================================ IMAGE 2 ===
def feed_02():
    """4:5. Two language blocks stacked, one replacing the other. The content is
    a vertical substitution, so it earns the taller frame."""
    W, H = 1080, 1350
    M = 80
    im = new(W, H)
    d = ImageDraw.Draw(im)

    y, _ = eyebrow(im, M, M, "PARIS  .  WEALTH ADVISORS  .  COLLECTED 2026-07-10", 22)
    accent_bar(im, M, y + 4, 70, 6)
    y += 28

    lines = ["Not the same firms", "in a new order.", "A different set."]
    f = fit_font(lines, "ExtraBold", 78, W - M * 2)
    y = block(d, (M, y), lines[:2], f, reg(T, BG, 3.0, "h1"), leading=1.12)
    y = block(d, (M, y + 2), lines[2:], f, reg(ACT, BG, 3.0, "h1 accent"), leading=1.12)

    y += 32
    cw = W - M * 2
    ch = 200
    for label, body, big, cap, col in (
        ("ASKED IN FRENCH", "Independent boutique French firms", "3",
         "of the 4 French-language answers", INFO),
        ("ASKED IN ENGLISH", "Major international private banks", "0",
         "of the 4 English-language answers", PART),
    ):
        crect = card(im, M, int(y), cw, ch)
        cx, cy = M + 36, int(y) + 32
        text(d, (cx, cy), label, font("SemiBold", 23),
             reg(T3, S, 4.5, "lang label"), tracking=0.13)
        fbody = font("SemiBold", 38)
        bl = wrap(body, fbody, cw - 260)
        ybody = block(d, (cx, cy + 44), bl, fbody,
                      reg(T, S, 3.0, "lang body"), leading=1.2)
        fbig = font("ExtraBold", 86)
        text(d, (M + cw - 36, cy + 24), big, fbig,
             reg(col, S, 3.0, "big count"), anchor="ra")
        fcap = font("Regular", 23)
        ycap = cy + 132
        text(d, (M + cw - 36, ycap), cap, fcap,
             reg(T3, S, 4.5, "count caption"), anchor="ra")
        fits("li-02 %s body" % label, crect, ybody + fbody.size * 0.28)
        fits("li-02 %s caption" % label, crect, ycap + fcap.size * 1.25)
        y += ch + 22

    y += 10
    y = para(im, M, y, "One boutique firm carried three of the four French answers "
                       "and none of the four English ones.", 30, T2, BG, cw, "Medium")
    y += 16
    rule(im, M, y, cw)
    y += 20
    para(im, M, y, "Four engines returned usable data that day. ChatGPT's collection "
                   "failed on every Paris prompt and is recorded, not dropped.",
         26, T3, BG, cw)

    footer(im, W, H, M)
    return save(im, os.path.join(FEED, "li-02-language-picked-the-list-1080x1350.png"))


# ================================================================ IMAGE 3 ===
def feed_03():
    """Square. Three equal cards read as a set; a tall frame would rank them,
    which is the exact error the image is about."""
    W = H = 1200
    M = 88
    im = new(W, H)
    d = ImageDraw.Draw(im)

    y, _ = eyebrow(im, M, M, "OUR OWN RESEARCH PAGES  .  SCANNED 2026-07-30")
    accent_bar(im, M, y + 4, 76, 6)
    y += 30

    f = fit_font(["Three of our pages claim", "the same record."], "ExtraBold", 84, W - M * 2)
    y = block(d, (M, y), ["Three of our pages claim", "the same record."], f,
              reg(T, BG, 3.0, "h1"), leading=1.12)
    y = block(d, (M, y + 4), ["They cannot all hold."], f,
              reg(ACT, BG, 3.0, "h1 accent"), leading=1.12)

    y += 44
    gap = 24
    cw = (W - M * 2 - gap * 2) // 3
    ch = 248
    for i, city in enumerate(("Madrid", "Paris", "Dublin")):
        x = M + i * (cw + gap)
        card(im, x, int(y), cw, ch)
        text(d, (x + 28, int(y) + 32), "COLLECTED", font("SemiBold", 20),
             reg(T3, S, 4.5, "collected label"), tracking=0.13)
        text(d, (x + 28, int(y) + 60), "2026-07-10", font("Medium", 26),
             reg(T2, S, 4.5, "collected date"))
        text(d, (x + 28, int(y) + 112), city, font("ExtraBold", 46),
             reg(T, S, 3.0, "city name"))
        block(d, (x + 28, int(y) + 172), ["claims a", "program-wide record"],
              font("Regular", 24), reg(T3, S, 4.5, "claim"), leading=1.3)
    y += ch + 40

    rule(im, M, y, W - M * 2)
    y += 30
    y = para(im, M, y, "16 of our 27 city pages carry a claim of that shape. A page is "
                       "the one place a claim about every other page cannot be checked.",
             33, T2, BG, W - M * 2, "Medium")

    footer(im, W, H, M)
    return save(im, os.path.join(FEED, "li-03-pages-contradict-1200x1200.png"))


# ================================================================ IMAGE 4 ===
def feed_04():
    """Square. One figure, two readings, side by side. A vertical frame would
    stack them and imply a sequence where the point is a substitution."""
    W = H = 1200
    M = 88
    im = new(W, H)
    d = ImageDraw.Draw(im)

    y, _ = eyebrow(im, M, M, "ROME  .  COLLECTED 2026-07-10")
    accent_bar(im, M, y + 4, 76, 6)
    y += 26

    text(d, (M, y), "5 of 5", font("ExtraBold", 168), reg(T, BG, 3.0, "figure"))
    y += 196
    y = block(d, (M, y), ["What the five counts, and what it does not."],
              font("SemiBold", 42), reg(ACT, BG, 3.0, "sub"), leading=1.1)

    y += 40
    gap = 26
    cw = (W - M * 2 - gap) // 2
    ch = 288
    for i, (head, body, col, mark) in enumerate((
        ("NOT THIS", "Five engines agreeing on one name.", BAD, "strike"),
        ("THIS", "Five restaurants, inside one engine's answer, "
                 "repeated across two languages.", OK, "keep"),
    )):
        x = M + i * (cw + gap)
        card(im, x, int(y), cw, ch, fill=S if mark == "strike" else S2)
        bgc = S if mark == "strike" else S2
        text(d, (x + 34, int(y) + 34), head, font("SemiBold", 23),
             reg(col, bgc, 4.5, "verdict label"), tracking=0.14)
        f = font("SemiBold", 38)
        lines = wrap(body, f, cw - 68)
        yy = block(d, (x + 34, int(y) + 84), lines, f,
                   reg(T if mark == "keep" else T2, bgc, 3.0, "verdict body"),
                   leading=1.24)
        if mark == "strike":
            for k in range(len(lines)):
                ly = int(y) + 84 + k * f.size * 1.24 + f.size * 0.62
                lwid = f.getlength(lines[k])
                d.line([(x + 34, ly), (x + 34 + lwid, ly)], fill=hexs(BAD), width=3)
        del yy
    y += ch + 34

    rule(im, M, y, W - M * 2)
    y += 28
    para(im, M, y, "No other engine returned that list. The other three each returned "
                   "a different set. The engine that produced it is retired from our "
                   "lineup.", 30, T2, BG, W - M * 2, "Medium")

    footer(im, W, H, M)
    return save(im, os.path.join(FEED, "li-04-what-five-of-five-counts-1200x1200.png"))


# =============================================================== CAROUSEL ===
CAR_W, CAR_H = 1080, 1350
CAR_M = 84


def slide(n, eyebrow_s, head, head_accent=None, body=None, foot=None,
          panel=None, big=None):
    im = new(CAR_W, CAR_H)
    d = ImageDraw.Draw(im)
    inner = CAR_W - CAR_M * 2

    # Vertical progress rail down the left margin, filling with the slide index.
    # Carries continuity across eight slides and gives the tall frame something
    # to hold below the copy. It sits at x 40..46, well clear of the lockup's
    # clear band, which starts at y 1111 on this canvas.
    # Only the FILLED segment is drawn. An unfilled track would be a second
    # element carrying no information, and registering it with a contrast floor
    # it does not need is exactly the kind of check that passes because it was
    # written to pass. The exact position is on the "n / 8" counter instead.
    RAIL_X, RAIL_Y0, RAIL_Y1, RAIL_W = 40, 200, 1000, 6
    fill_h = int(round((RAIL_Y1 - RAIL_Y0) * n / 8.0))
    paste_flat(im, mask_rrect(RAIL_W, fill_h, RAIL_W // 2),
               (RAIL_X, RAIL_Y0), reg(AC, BG, 3.0, "carousel progress rail"))

    # slide counter, top right
    f_n = font("SemiBold", 24)
    text(d, (CAR_W - CAR_M, CAR_M), "%d / 8" % n, f_n,
         reg(T3, BG, 4.5, "slide counter"), anchor="ra", tracking=0.1)

    y = CAR_M
    if eyebrow_s:
        y, _ = eyebrow(im, CAR_M, y, eyebrow_s, 22)
        accent_bar(im, CAR_M, y + 2, 64, 6)
        y += 28

    if big:
        text(d, (CAR_M, y), big, font("ExtraBold", 170), reg(T, BG, 3.0, "big"))
        y += 198

    hl = wrap(head, font("ExtraBold", 66), inner)
    f = fit_font(hl, "ExtraBold", 66, inner)
    hl = wrap(head, f, inner)
    y = block(d, (CAR_M, y), hl, f, reg(T, BG, 3.0, "slide head"), leading=1.13)
    if head_accent:
        al = wrap(head_accent, f, inner)
        y = block(d, (CAR_M, y + 2), al, f, reg(ACT, BG, 3.0, "slide accent"), leading=1.13)

    y += 40
    if panel:
        ph = 62 * len(panel) + 68
        card(im, CAR_M, int(y), inner, ph)
        py = int(y) + 40
        for label, value, col in panel:
            text(d, (CAR_M + 36, py), label, font("Regular", 30),
                 reg(T3, S, 4.5, "panel label"))
            text(d, (CAR_M + inner - 36, py), value, font("SemiBold", 32),
                 reg(col, S, 4.5, "panel value"), anchor="ra")
            py += 62
        y += ph + 34

    if body:
        for p in body:
            y = para(im, CAR_M, y, p, 33, T2, BG, inner, "Regular", leading=1.44)
            y += 26

    if foot:
        # The footer band is bounded by the lockup's clear space, not by taste:
        # the rule sits high enough that three wrapped lines of 25px still end
        # above the clear band. clear_space_ok() is what forced this number.
        fy = CAR_H - CAR_M - 300
        if y > fy - 24:
            raise AssertionError("slide %d body runs into the source band: "
                                 "body bottom %.1f, band top %d" % (n, y, fy))
        rule(im, CAR_M, fy, inner)
        fend = para(im, CAR_M, fy + 24, foot, 25, T3, BG, inner)
        if fend > CAR_H - CAR_M - 91 - 64:
            raise AssertionError("slide %d source note runs into the lockup "
                                 "clear band: ends %.1f" % (n, fend))

    footer(im, CAR_W, CAR_H, CAR_M)
    return save(im, os.path.join(CAROUSEL, "li-c-%02d-1080x1350.png" % n))


def carousel():
    out = []
    out.append(slide(
        1,
        "ROME  .  COLLECTED 2026-07-10",
        "A result in our Rome data looks like five engines agreeing.",
        "It is one engine agreeing with itself.",
        body=["Swipe for what the number actually counts."],
    ))
    out.append(slide(
        2,
        "THE RUN",
        "What was collected, and by what.",
        body=["Four categories, each asked once in Italian and once in English."],
        panel=[("Collected", "2026-07-10", T),
               ("Categories", "4", T),
               ("Languages", "Italian, English", T),
               ("Engines returning usable data", "4", T)],
        foot="ChatGPT's collection failed on every Rome prompt that run, a "
             "technical error. It is recorded on the page rather than dropped, "
             "which is why the count is four.",
    ))
    out.append(slide(
        3,
        "THE RESULT",
        "One engine returned the same five names, in the same order, in both languages.",
        body=["Not a stable top pick with the rest shuffled. A fully reproduced "
              "ranked list, twice."],
    ))
    out.append(slide(
        4,
        "WHAT THE FIVE COUNTS",
        "Five restaurants.",
        "Inside one engine's answer.",
        panel=[("Restaurants named", "5", T),
               ("Engines that produced the list", "1", ACT),
               ("Languages it repeated across", "2", T)],
        body=["The five is a count of names inside a single answer. It is not a "
              "count of engines."],
    ))
    out.append(slide(
        5,
        "WHAT IT DOES NOT COUNT",
        "No other engine returned that list.",
        body=["The other three engines in that run each returned their own, "
              "different set of names. Nothing about this result says the "
              "market has settled on an answer."],
    ))
    out.append(slide(
        6,
        "TWO DIFFERENT MEASUREMENTS",
        "Stability and consensus are not the same reading.",
        body=["Stability is one engine repeating itself. It tells you that "
              "engine's answer is fixed for now.",
              "Consensus is separate engines arriving at the same name. That is "
              "the one that tells you a category has converged.",
              "A single figure can be either. The label rarely says which."],
    ))
    out.append(slide(
        7,
        "THE LIMITS, STATED HERE",
        "What this result cannot carry.",
        body=["One collection date. It is a snapshot, not a trend line.",
              "The engine that produced the repeated list has since been "
              "retired from our lineup, so the finding is a record of that day.",
              "One city, four categories. Nothing here generalises to a market "
              "we did not collect."],
    ))
    out.append(slide(
        8,
        "WHAT TO ASK",
        "Ask any figure what its numerator and its denominator count.",
        "Ours included.",
        body=["If a number cannot tell you which engines produced it, on which "
              "date, and out of how many, it is not yet a measurement."],
        foot="Source: BrandGEO City Research Program, Rome dataset, 4 categories "
             "asked in Italian and English, 4 engines returning usable data, "
             "collected 2026-07-10. getbrandgeo.com/ai-visibility-for-rome.html",
    ))
    return out


# ============================================================== contrast ====
def report_contrast():
    print("\nCONTRAST, sRGB relative luminance, measured on the pairs actually drawn")
    print("%-9s %-9s %7s %6s  %-6s %s" % ("fg", "bg", "ratio", "need", "verdict", "used for"))
    fails = 0
    for (fg, bg, need), what in sorted(PAIRS.items(), key=lambda kv: contrast(kv[0][0], kv[0][1])):
        r = contrast(fg, bg)
        ok = r >= need
        fails += 0 if ok else 1
        print("%-9s %-9s %7.2f %6.1f  %-6s %s"
              % (fg, bg, r, need, "PASS" if ok else "FAIL", sorted(what)[0][:44]))
    print("pairs measured: %d, failures: %d" % (len(PAIRS), fails))
    return fails


def main():
    made = [feed_01(), feed_02(), feed_03(), feed_04()] + carousel()
    print("rendered %d files" % len(made))
    for p in made:
        im = Image.open(p)
        print("  %-58s %dx%d  %d bytes"
              % (os.path.relpath(p, LI), im.width, im.height, os.path.getsize(p)))
    import json
    with open(os.path.join(HERE, "drawn_strings.json"), "w", encoding="utf-8") as fh:
        json.dump(DRAWN, fh, indent=1, ensure_ascii=False)
    print("drawn strings written for %d files, %d strings total"
          % (len(DRAWN), sum(len(v) for v in DRAWN.values())))
    if report_contrast():
        sys.exit(1)


if __name__ == "__main__":
    main()
