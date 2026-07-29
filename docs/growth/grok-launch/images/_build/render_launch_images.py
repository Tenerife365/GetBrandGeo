"""
BrandGEO seventh-engine launch: every post image and channel banner.

Renders with Pillow only. No matplotlib, no cairosvg, no ImageMagick, none of
which are installed. Shapes are drawn into 8x supersampled masks and downsampled
with Lanczos, the same technique as
`docs/growth/brand-identity-2026-07-29/v3/build/render_v3.py`.

Type is real Inter, extracted from the repo by `extract_inter.py`. Inter is not
installed as a system font on this machine; see that file for how it is obtained
without a download.

Dimensions come from the consolidated render matrix in
`docs/growth/channel-specs-2026-07-29.md`. Copy comes from
`docs/growth/2026-07-29-grok-sixth-engine/`. No claim on any image is new.

Run: python render_launch_images.py
"""

import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
FONTS = os.path.join(HERE, "fonts")
MARK = os.path.abspath(os.path.join(
    HERE, "..", "..", "..", "brand-identity-2026-07-29", "v3", "png", "mark-1024.png"))

SS = 8  # supersample factor for shape masks

# ---------------------------------------------------------------- palette ---
BG = "#0a0b0e"      # canvas
S = "#101116"       # card surface
S2 = "#16171e"      # raised surface
BD = "#23242b"      # hairline border
BD2 = "#32333c"     # stronger border
AC = "#8b5cf6"      # primary violet, FILL only
ACS = "#7c3aed"     # CTA fill
ACT = "#a78bfa"     # accent WORDS
T = "#e8e9ed"       # primary text
T2 = "#9ba1ac"      # secondary text
T3 = "#7d838f"      # muted text
WARN = "#fbbf24"    # risk, loss

GRAD = [(0.00, "#6366F1"), (0.55, "#8B5CF6"), (1.00, "#7C3AED")]

# The seven engines on Growth PRO and above, in ladder order.
# planConfig.ts:53 to :68, via 00-strategy.md section 3.
ENGINES = [
    ("ChatGPT", False),
    ("Gemini", False),
    ("Claude", False),
    ("Perplexity", False),
    ("Google AI Mode", False),
    ("Grok", True),
    ("Google AI Overviews", True),
]


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
    """Antialiased rounded-rectangle mask via 8x supersampling."""
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
    """Checkmark polyline, drawn thick then downsampled."""
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
    layer = Image.new("RGB", mask.size, hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, xy, mask)


def paste_grad(base, mask, xy, vertical=False):
    base.paste(grad_image(mask.size[0], mask.size[1], vertical), xy, mask)


def glow(base, mask, xy, colour, radius, strength=1.0):
    """Additive bloom so an emissive shape reads as emissive on near-black."""
    w, h = base.size
    pad = radius * 3
    canvas = Image.new("L", (w, h), 0)
    canvas.paste(mask, xy)
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius))
    a = np.asarray(canvas).astype(np.float32) / 255.0 * strength
    c = np.array(hexs(colour) if isinstance(colour, str) else colour, dtype=np.float32)
    b = np.asarray(base).astype(np.float32)
    out = np.clip(b + a[..., None] * c, 0, 255).astype(np.uint8)
    base.paste(Image.fromarray(out), (0, 0))
    del pad


# ------------------------------------------------------------------ type ----
_font_cache = {}


def font(weight, size):
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONTS, f"Inter-{weight}.ttf"), size)
    return _font_cache[key]


def text(d, xy, s, f, fill, anchor="la", tracking=0.0):
    """Draw text. tracking is in em, applied per character when non-zero."""
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


def fit_font(lines, weight, start, max_w, floor=18):
    """Largest size at which every line clears max_w. Used everywhere a headline
    shares a canvas with a graphic, because eyeballed point sizes are exactly
    how text ends up running underneath the artwork."""
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


# --------------------------------------------------------------- wordmark ---
_mark_cache = None


def mark_rgba():
    global _mark_cache
    if _mark_cache is None:
        im = Image.open(MARK).convert("RGBA")
        _mark_cache = im.crop(im.getchannel("A").getbbox())
    return _mark_cache


def wordmark(base, x, y, cap, colour=T, anchor="lm"):
    """Mark plus 'BrandGEO' set in Inter SemiBold.

    `logo-full.svg` is not production ready, its wordmark is live text rather
    than outlined paths, so the text is set here instead of rasterised from it.
    Returns the total width drawn.
    """
    m = mark_rgba()
    h = int(round(cap * 1.42))
    w = int(round(h * m.width / m.height))
    m = m.resize((w, h), Image.LANCZOS)
    gap = int(round(cap * 0.46))
    f = font("SemiBold", int(round(cap / 0.727)))  # Inter cap height is .727 em
    label = "BrandGEO"
    tw = tracked_width(label, f, -0.012)
    total = w + gap + tw
    left = x if anchor[0] == "l" else x - total if anchor[0] == "r" else x - total / 2
    top = int(round(y - h / 2))
    base.paste(m, (int(round(left)), top), m)
    d = ImageDraw.Draw(base)
    text(d, (left + w + gap, y), label, f, colour, anchor="lm", tracking=-0.012)
    return total


# ------------------------------------------------------------- components ---
def engine_card(w, h, scale=1.0, show_meta=True):
    """The seven-engine proof block. Seven rows, each checked, plus the retired
    Meta AI row struck through below a rule. V2 in 09-visuals.md."""
    card = Image.new("RGB", (w, h), hexs(S))
    bm = mask_rrect(w, h, int(20 * scale))
    d = ImageDraw.Draw(card)

    pad = int(30 * scale)
    rows = len(ENGINES) + (1 if show_meta else 0)
    head_h = int(34 * scale)
    avail = h - pad * 2 - head_h
    rh = avail / (rows + (0.45 if show_meta else 0))

    f_lab = font("Medium", int(round(rh * 0.40)))
    f_tag = font("SemiBold", int(round(rh * 0.27)))

    # Two header labels only fit when the card is wide enough for both plus a
    # real gap. Below that the right-hand one is dropped rather than collided.
    left_hd, right_hd = "ENGINES MONITORED", "GROWTH PRO AND ABOVE"
    text(d, (pad, pad), left_hd, f_tag, T3, tracking=0.13)
    if (tracked_width(left_hd, f_tag, 0.13) + tracked_width(right_hd, f_tag, 0.13)
            + pad * 2 + 40 <= w):
        text(d, (w - pad, pad), right_hd, f_tag, T3, anchor="ra", tracking=0.13)

    y = pad + head_h
    ck = int(rh * 0.44)
    lab_x = pad + ck + int(16 * scale)
    for i, (name, is_new) in enumerate(ENGINES):
        cy = y + rh * 0.5
        ring = mask_ring(ck, max(2, int(ck * 0.09)))
        col = ACT if is_new else T3
        paste_flat(card, ring, (pad, int(cy - ck / 2)), col)
        chk = mask_check(ck, ck * 0.13)
        paste_flat(card, chk, (pad, int(cy - ck / 2)), col)
        tag = "NEW, LIVE TODAY" if is_new else "WEB SEARCH ON"
        tag_w = tracked_width(tag, f_tag, 0.11)
        # "Google AI Overviews" is the longest label and the one that collides.
        # Shrink the label to fit rather than letting it run into the tag.
        room = w - pad - tag_w - 26 - lab_x
        fl = f_lab
        size = f_lab.size
        while fl.getlength(name) > room and size > 10:
            size -= 1
            fl = font("Medium", size)
        text(d, (lab_x, cy), name, fl, T if is_new else T2, anchor="lm")
        text(d, (w - pad, cy), tag, f_tag, ACT if is_new else T3, anchor="rm", tracking=0.11)
        if i < len(ENGINES) - 1:
            d.line([(pad, y + rh), (w - pad, y + rh)], fill=hexs(BD), width=1)
        y += rh

    if show_meta:
        y += rh * 0.22
        d.line([(pad, y), (w - pad, y)], fill=hexs(BD2), width=1)
        y += rh * 0.22
        cy = y + rh * 0.5
        label = "Meta AI"
        text(d, (pad + ck + int(16 * scale), cy), label, f_lab, T3, anchor="lm")
        lx = pad + ck + int(16 * scale)
        lw = f_lab.getlength(label)
        d.line([(lx - 3, cy), (lx + lw + 3, cy)], fill=hexs(WARN), width=max(2, int(2 * scale)))
        text(d, (w - pad, cy), "RETIRED 16 JULY", f_tag, WARN, anchor="rm", tracking=0.11)

    out = Image.new("RGB", (w, h), hexs(BG))
    out.paste(card, (0, 0), bm)
    bd = Image.new("RGB", (w, h), hexs(BD))
    edge = Image.new("L", (w, h), 0)
    ImageDraw.Draw(edge).rounded_rectangle(
        [0, 0, w - 1, h - 1], radius=int(20 * scale), outline=255, width=1)
    out.paste(bd, (0, 0), edge)
    return out, bm


def monoliths(base, x, y, w, h, count=7, unlit=2, gap_ratio=0.42, glow_strength=0.85):
    """V1's motif, rendered rather than generated. Standing forms lit from
    within, one inert. `unlit` is a zero-based index, third from left in V1.

    Height variance is deliberately small. Tall differences read as a bar chart,
    and a bar chart on these assets would imply measured values for engines that
    have returned zero rows.
    """
    bw = w / (count + (count - 1) * gap_ratio)
    gap = bw * gap_ratio
    heights = [0.88, 0.97, 0.91, 1.0, 0.93, 0.98, 0.90]
    for i in range(count):
        bh = int(h * heights[i % len(heights)])
        bx = int(round(x + i * (bw + gap)))
        by = int(round(y + h - bh))
        bwi = int(round(bw))
        r = max(3, int(bwi * 0.16))
        m = mask_rrect(bwi, bh, r)
        if i == unlit:
            paste_flat(base, m, (bx, by), S2)
            edge = Image.new("L", (bwi, bh), 0)
            ImageDraw.Draw(edge).rounded_rectangle(
                [0, 0, bwi - 1, bh - 1], radius=r, outline=255, width=max(1, bwi // 90))
            paste_flat(base, edge, (bx, by), BD2)
        else:
            glow(base, m, (bx, by), AC, max(6, int(bwi * 0.55)), glow_strength)
            paste_grad(base, m, (bx, by), vertical=True)


def vignette(base, cx, cy, radius, colour=AC, strength=0.16):
    """Soft off-canvas bloom. Kept low so flat fields stay flat for JPEG."""
    w, h = base.size
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - cx) / radius) ** 2 + ((yy - cy) / radius) ** 2)
    a = np.clip(1.0 - r, 0, 1) ** 2 * strength
    c = np.array(hexs(colour), dtype=np.float32)
    b = np.asarray(base).astype(np.float32)
    base.paste(Image.fromarray(np.clip(b + a[..., None] * c, 0, 255).astype(np.uint8)), (0, 0))


def canvas(w, h):
    return Image.new("RGB", (w, h), hexs(BG))


# ------------------------------------------------------------------ save ----
written = []


def save_png(im, name):
    p = os.path.join(OUT, name)
    im.save(p, "PNG", optimize=True)
    written.append(p)


def save_jpeg(im, name, quality=96, dither=3):
    """Instagram's API accepts JPEG only, and JPEG bands on near-black violet.
    Quality 96, 4:4:4 chroma, and a small uniform dither to break the banding."""
    a = np.asarray(im).astype(np.int16)
    rng = np.random.default_rng(20260729)
    a = a + rng.integers(-dither, dither + 1, size=a.shape, dtype=np.int16)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    p = os.path.join(OUT, name)
    im.save(p, "JPEG", quality=quality, subsampling=0, optimize=True, progressive=True)
    written.append(p)


# ================================================================ assets ====
def link_card():
    """R3, 1200x630. Blog og:image, Facebook link post, LinkedIn unfurl,
    X large summary card. One file, four consumers."""
    w, h = 1200, 630
    im = canvas(w, h)
    vignette(im, w * 0.86, h * 0.10, w * 0.62, AC, 0.14)
    d = ImageDraw.Draw(im)

    pad = 68
    colw = 560
    text(d, (pad, pad + 4), "TWO ENGINES LIVE, 29 JULY 2026", font("SemiBold", 19), ACT,
         tracking=0.15)
    y = block(d, (pad, pad + 52), ["Seven engines.", "All seven retrieve."],
              font("Bold", 62), T, leading=1.12)
    y += 18
    block(d, (pad, y), wrap("Meta AI removed 16.07.2026. DeepSeek and Copilot excluded.",
                            font("Regular", 22), colw - 40),
          font("Regular", 22), T2, leading=1.42)

    card, bm = engine_card(430, h - pad * 2, scale=0.86)
    im.paste(card, (w - pad - 430, pad), bm)

    wordmark(im, pad, h - pad + 6, 22)
    text(d, (pad + 220, h - pad + 6), "getbrandgeo.com", font("Medium", 19), T3, anchor="lm")
    save_png(im, "link-card-1200x630.png")


def hero():
    """R6, 1600x900. Article hero for the blog post. The web agent references
    this exact filename relative to its own page."""
    w, h = 1600, 900
    im = canvas(w, h)
    vignette(im, w * 0.5, h * 1.02, w * 0.72, AC, 0.15)
    d = ImageDraw.Draw(im)

    pad = 96
    text(d, (pad, pad), "BRANDGEO RESEARCH", font("SemiBold", 21), ACT, tracking=0.16)
    lines = wrap("Did it go and look, or did it answer from memory?",
                 font("Bold", 84), w - pad * 2 - 120)
    y = block(d, (pad, pad + 56), lines, font("Bold", 84), T, leading=1.10)
    y += 22
    text(d, (pad, y), "Seven engines. All seven retrieve.", font("Medium", 30), T2)

    monoliths(im, pad, h - 348, 560, 268, count=7, unlit=2, gap_ratio=0.55,
              glow_strength=0.7)
    # Verbatim from 01-blog.md, not paraphrased.
    block(d, (pad + 620, h - 236),
          ["Those produce different answers to the",
           "same question, and only one of them",
           "tells you anything about today."],
          font("Regular", 27), T2, leading=1.46)
    wordmark(im, w - pad, pad + 14, 24, anchor="rm")
    save_png(im, "bg-020-hero.png")


def instagram_portrait():
    """R2, 1080x1350, JPEG. Carousel slide 1 copy, run as the feed hook.
    Flat fields throughout, no long gradients, per the IG format trap."""
    w, h = 1080, 1350
    im = canvas(w, h)
    d = ImageDraw.Draw(im)
    pad = 96

    panel = mask_rrect(w - pad * 2, 250, 24)
    paste_flat(im, panel, (pad, pad + 76), S)

    text(d, (pad, pad), "AI VISIBILITY", font("SemiBold", 24), ACT, tracking=0.18)

    f_q = font("Bold", 62)
    q = wrap("Your AI tool lists 9 engines.", f_q, w - pad * 2 - 88)
    block(d, (pad + 44, pad + 76 + 62), q, f_q, T2, leading=1.16)

    f_a = font("ExtraBold", 86)
    a = wrap("How many actually searched the web?", f_a, w - pad * 2)
    y = block(d, (pad, pad + 434), a, f_a, T, leading=1.10)

    y += 44
    bar = mask_rrect(150, 8, 4)
    paste_flat(im, bar, (pad, int(y)), ACS)

    y += 76
    y = block(d, (pad, y), wrap("An engine with no retrieval answers from memory, "
                                "not from today.", font("Medium", 36), w - pad * 2),
              font("Medium", 36), T2, leading=1.38)

    # Flat proof strip. Fills the lower third and keeps the fields flat, which
    # is what JPEG needs against this canvas.
    y += 66
    strip_h = 214
    m = mask_rrect(w - pad * 2, strip_h, 24)
    paste_flat(im, m, (pad, int(y)), S)
    text(d, (pad + 44, y + 46), "BRANDGEO, GROWTH PRO AND ABOVE",
         font("SemiBold", 23), T3, tracking=0.15)
    text(d, (pad + 44, y + 92), "Seven engines. All seven retrieve.",
         font("Bold", 44), T)
    text(d, (pad + 44, y + 152), "Grok and Google AI Overviews added 29 July.",
         font("Regular", 27), T2)

    wordmark(im, pad, h - pad - 4, 27)
    save_jpeg(im, "instagram-portrait-1080x1350.jpg")


def instagram_square():
    """R5, 1080x1080, JPEG. Carousel slide 6 copy. Flat blocks."""
    w, h = 1080, 1080
    im = canvas(w, h)
    d = ImageDraw.Draw(im)
    pad = 90

    text(d, (pad, pad), "GROWTH PRO AND ABOVE", font("SemiBold", 24), ACT, tracking=0.18)

    f = font("ExtraBold", 76)
    y = block(d, (pad, pad + 62), ["Seven engines now."], f, T, leading=1.08)
    y = block(d, (pad, y + 2), wrap("Every one runs live web search.", f, w - pad * 2),
              f, ACT, leading=1.08)

    # Named rows, not anonymous chips. An unlabelled grid where five tiles are
    # muted and two are violet reads as five engines switched off, which is the
    # opposite of the claim. Every row here is checked and named.
    y += 52
    rh = 62
    f_n = font("Medium", 33)
    f_t = font("SemiBold", 21)
    for i, (name, is_new) in enumerate(ENGINES):
        cy = y + i * rh + rh / 2
        ck = 30
        col = ACT if is_new else T
        paste_flat(im, mask_ring(ck, 3), (pad, int(cy - ck / 2)), col)
        paste_flat(im, mask_check(ck, 4), (pad, int(cy - ck / 2)), col)
        text(d, (pad + ck + 20, cy), name, f_n, col, anchor="lm")
        if is_new:
            text(d, (pad + ck + 20 + f_n.getlength(name) + 22, cy + 1), "NEW",
                 f_t, ACT, anchor="lm", tracking=0.12)
        if i < len(ENGINES) - 1:
            d.line([(pad, y + (i + 1) * rh), (w - pad, y + (i + 1) * rh)],
                   fill=hexs(BD), width=1)

    y += len(ENGINES) * rh + 40
    text(d, (pad, y), "Grok and Google AI Overviews added 29 July.",
         font("Regular", 28), T2)
    wordmark(im, pad, h - pad + 6, 26)
    save_jpeg(im, "instagram-square-1080x1080.jpg")


def facebook_feed():
    """R2a, 1440x1800, PNG. Facebook feed image. Loss-aversion driver, 4c."""
    w, h = 1440, 1800
    im = canvas(w, h)
    vignette(im, w * 0.5, -h * 0.05, w * 0.9, AC, 0.13)
    d = ImageDraw.Draw(im)
    pad = 110

    text(d, (pad, pad), "AI VISIBILITY REPORTING", font("SemiBold", 26), ACT, tracking=0.17)
    f = font("Bold", 96)
    y = block(d, (pad, pad + 66), wrap("The report looks the same either way.", f,
                                       w - pad * 2), f, T, leading=1.09)
    y += 34
    y = block(d, (pad, y), wrap("Some AI engines answer from training data rather than "
                                "searching the web.", font("Regular", 38), w - pad * 2),
              font("Regular", 38), T2, leading=1.40)

    card_y = int(y) + 66
    card_h = h - pad - 132 - card_y
    card, bm = engine_card(w - pad * 2, card_h, scale=1.05)
    im.paste(card, (pad, card_y), bm)

    wordmark(im, pad, h - pad - 6, 30)
    text(d, (w - pad, h - pad - 6), "getbrandgeo.com", font("Medium", 26), T3, anchor="rm")
    save_png(im, "facebook-feed-1440x1800.png")


def x_post():
    """R6, 1600x900, PNG. X in-feed image for the standalone post, 4a."""
    w, h = 1600, 900
    im = canvas(w, h)
    vignette(im, w * 0.18, h * 0.9, w * 0.7, AC, 0.13)
    d = ImageDraw.Draw(im)
    pad = 92

    gfx_w = 440
    col = w - pad * 2 - gfx_w - 64
    lines = ["Seven engines now.", "All seven actually retrieve."]
    size = 82
    while size > 30 and max(font("Bold", size).getlength(s) for s in lines) > col:
        size -= 2
    f = font("Bold", size)

    text(d, (pad, pad + 8), "29 JULY 2026", font("SemiBold", 21), ACT, tracking=0.16)
    top = (h - f.size * 1.11 * len(lines)) / 2 - 30
    y = block(d, (pad, top), lines, f, T, leading=1.11)
    y += 22
    text(d, (pad, y), "Ask your vendor which of theirs do.", font("Medium", 34), ACT)

    monoliths(im, w - pad - gfx_w, pad + 30, gfx_w, h - pad * 2 - 70, count=7, unlit=2,
              gap_ratio=0.5, glow_strength=0.75)

    wordmark(im, pad, h - pad + 10, 24)
    save_png(im, "x-post-1600x900.png")


def tiktok_cover():
    """1080x1920 JPEG cover. Two crops apply at once: TikTok's grid takes a 1:1
    centre (y 420 to 1500) and Meta's usable band on a 9:16 master is y 269 to
    1248. Everything load-bearing sits in the intersection, y 430 to 1240."""
    w, h = 1080, 1920
    im = canvas(w, h)
    vignette(im, w * 0.5, h * 0.36, w * 0.95, AC, 0.15)
    d = ImageDraw.Draw(im)
    pad = 92

    text(d, (w / 2, 466), "AI VISIBILITY", font("SemiBold", 26), ACT, anchor="ma", tracking=0.2)

    f = font("ExtraBold", 92)
    lines = wrap("you're paying for engines that don't work", f, w - pad * 2)
    y = block(d, (w / 2, 536), lines, f, T, leading=1.10, anchor="ma")

    y += 34
    bar = mask_rrect(170, 8, 4)
    paste_flat(im, bar, (int(w / 2 - 85), int(y)), ACS)

    y += 60
    y = block(d, (w / 2, y), wrap("ask them which ones searched", font("Medium", 42),
                                  w - pad * 2),
              font("Medium", 42), T2, leading=1.34, anchor="ma")

    # Everything is placed off the measured bottom of the last text line rather
    # than a guessed y, so nothing can land on top of the graphic.
    mono_top, mono_h = int(y) + 44, 132
    monoliths(im, pad + 150, mono_top, w - (pad + 150) * 2, mono_h, count=7, unlit=2,
              gap_ratio=0.5, glow_strength=0.6)
    mark_y = mono_top + mono_h + 52
    assert mark_y + 20 < 1248, "wordmark would fall outside Meta's usable band"
    wordmark(im, w / 2, mark_y, 26, anchor="ma")
    save_jpeg(im, "tiktok-cover-1080x1920.jpg")


def youtube_thumbnail():
    """R8, 1920x1080, PNG, under 2 MB. Poster for the long-form video, whose
    title is a question. Deliberately not the same file as any R4 frame."""
    w, h = 1920, 1080
    im = canvas(w, h)
    vignette(im, w * 0.72, h * 0.5, w * 0.6, AC, 0.17)
    d = ImageDraw.Draw(im)
    pad = 100

    text(d, (pad, pad + 6), "SEVEN ENGINES", font("SemiBold", 30), ACT, tracking=0.2)

    # Auto-fit rather than trusting an eyeballed point size. The headline column
    # stops where the graphic column starts, and nothing is allowed to cross it.
    gfx_w = 470
    col = w - pad * 2 - gfx_w - 70
    lines = ["WHICH ONES", "ANSWERED FROM", "MEMORY?"]
    size = 150
    while size > 40 and max(font("ExtraBold", size).getlength(s) for s in lines) > col:
        size -= 2
    f = font("ExtraBold", size)
    lh = f.size * 1.06
    top = (h - lh * len(lines)) / 2 + 28
    block(d, (pad, top), lines[:2], f, T, leading=1.06)
    block(d, (pad, top + lh * 2), lines[2:], f, ACT, leading=1.06)

    monoliths(im, w - pad - gfx_w, pad + 60, gfx_w, h - pad * 2 - 60, count=7, unlit=2,
              gap_ratio=0.5, glow_strength=0.85)

    wordmark(im, pad, h - pad + 8, 30)
    save_png(im, "youtube-thumbnail-1920x1080.png")


def youtube_banner():
    """R7, 2560x1440. The safe area is 1235x338 at the 2048x1152 minimum, which
    scales to 1544x423 centred on a 2560x1440 upload: x 508 to 2052,
    y 508 to 931. Everything outside that is desktop-only decoration."""
    w, h = 2560, 1440
    sx0, sy0, sw, sh = 508, 508, 1544, 423
    im = canvas(w, h)
    vignette(im, w * 0.5, h * 0.5, w * 0.55, AC, 0.15)

    # Decoration lives entirely outside the safe rectangle.
    monoliths(im, 90, 470, 360, 500, count=5, unlit=1, gap_ratio=0.55, glow_strength=0.55)
    monoliths(im, w - 450, 470, 360, 500, count=5, unlit=3, gap_ratio=0.55, glow_strength=0.55)

    d = ImageDraw.Draw(im)
    cx = sx0 + sw / 2
    wordmark(im, cx, sy0 + 96, 46, anchor="ma")
    text(d, (cx, sy0 + 186), "Seven engines. All seven retrieve.",
         font("Bold", 62), T, anchor="ma")
    text(d, (cx, sy0 + 274), "Every engine we monitor runs live web search.",
         font("Regular", 32), T2, anchor="ma")
    text(d, (cx, sy0 + 348), "GETBRANDGEO.COM", font("SemiBold", 26), ACT,
         anchor="ma", tracking=0.2)
    save_png(im, "youtube-banner-2560x1440.png")


def x_header():
    """1500x500. X overlays the avatar over the lower left, so the left 300 px
    is left empty."""
    w, h = 1500, 500
    im = canvas(w, h)
    vignette(im, w * 0.78, h * 0.2, w * 0.6, AC, 0.16)
    d = ImageDraw.Draw(im)

    gfx_x, gfx_w = 1150, 300
    monoliths(im, gfx_x, 110, gfx_w, 280, count=7, unlit=2, gap_ratio=0.5,
              glow_strength=0.7)

    x = 340  # X overlays the avatar over the lower left, so that corner stays clear
    col = gfx_x - x - 50
    f = fit_font(["Seven engines.", "All seven retrieve."], "Bold", 54, col)
    text(d, (x, 142), "SEVEN ENGINES, ALL RETRIEVING", font("SemiBold", 22), ACT,
         anchor="lm", tracking=0.18)
    block(d, (x, 178), ["Seven engines.", "All seven retrieve."], f, T, leading=1.14)
    fs = fit_font(["Meta AI removed 16.07.2026. DeepSeek and Copilot excluded."],
                  "Regular", 24, col)
    text(d, (x, 366), "Meta AI removed 16.07.2026. DeepSeek and Copilot excluded.",
         fs, T2, anchor="lm")
    text(d, (x, 412), "getbrandgeo.com", font("Medium", 24), T3, anchor="lm")
    save_png(im, "x-header-1500x500.png")


def facebook_cover():
    """1640x624, twice the 820x312 desktop spec. Facebook's mobile crop is
    narrower than its desktop crop, so everything sits inside the central
    1100 px."""
    w, h = 1640, 624
    im = canvas(w, h)
    vignette(im, w * 0.5, h * 0.5, w * 0.45, AC, 0.16)
    d = ImageDraw.Draw(im)

    gfx_w = 270
    monoliths(im, 44, 176, gfx_w, 276, count=5, unlit=1, gap_ratio=0.55, glow_strength=0.5)
    monoliths(im, w - 44 - gfx_w, 176, gfx_w, 276, count=5, unlit=3, gap_ratio=0.55,
              glow_strength=0.5)

    cx = w / 2
    col = w - 2 * (44 + gfx_w + 40)
    wordmark(im, cx, 172, 32, anchor="ma")
    f = fit_font(["Seven engines. All seven retrieve."], "Bold", 56, col)
    text(d, (cx, 262), "Seven engines. All seven retrieve.", f, T, anchor="ma")
    fs = fit_font(["Every engine we monitor runs live web search."], "Regular", 28, col)
    text(d, (cx, 344), "Every engine we monitor runs live web search.", fs, T2, anchor="ma")
    text(d, (cx, 412), "GETBRANDGEO.COM", font("SemiBold", 24), ACT, anchor="ma", tracking=0.2)
    save_png(im, "facebook-cover-1640x624.png")


def linkedin_covers():
    """Company page cover is 1128x191, personal cover is 1584x396. LinkedIn
    overlays the logo or photo over the lower left of both, so both keep their
    left edge clear."""
    # Company page
    w, h = 1128, 191
    im = canvas(w, h)
    vignette(im, w * 0.7, h * 0.4, w * 0.5, AC, 0.16)
    gfx_x, gfx_w = w - 200, 160
    monoliths(im, gfx_x, 46, gfx_w, 100, count=7, unlit=2, gap_ratio=0.5, glow_strength=0.6)
    d = ImageDraw.Draw(im)
    x, col = 250, gfx_x - 250 - 40
    f = fit_font(["Seven engines. All seven retrieve."], "Bold", 38, col)
    text(d, (x, 76), "Seven engines. All seven retrieve.", f, T, anchor="lm")
    fs = fit_font(["Every engine we monitor runs live web search."], "Regular", 21, col)
    text(d, (x, 124), "Every engine we monitor runs live web search.", fs, T2, anchor="lm")
    save_png(im, "linkedin-cover-company-1128x191.png")

    # Personal profile
    w, h = 1584, 396
    im = canvas(w, h)
    vignette(im, w * 0.72, h * 0.3, w * 0.55, AC, 0.16)
    gfx_x, gfx_w = w - 380, 300
    monoliths(im, gfx_x, 96, gfx_w, 210, count=7, unlit=2, gap_ratio=0.5, glow_strength=0.65)
    d = ImageDraw.Draw(im)
    x, col = 380, gfx_x - 380 - 44
    text(d, (x, 128), "SEVEN ENGINES, ALL RETRIEVING", font("SemiBold", 20), ACT,
         anchor="lm", tracking=0.18)
    f = fit_font(["Seven engines. All seven retrieve."], "Bold", 48, col)
    text(d, (x, 192), "Seven engines. All seven retrieve.", f, T, anchor="lm")
    fs = fit_font(["Meta AI removed 16.07.2026. DeepSeek and Copilot excluded."],
                  "Regular", 24, col)
    text(d, (x, 254), "Meta AI removed 16.07.2026. DeepSeek and Copilot excluded.",
         fs, T2, anchor="lm")
    text(d, (x, 310), "getbrandgeo.com", font("Medium", 24), T3, anchor="lm")
    save_png(im, "linkedin-cover-personal-1584x396.png")


# ------------------------------------------------------------------ main ----
def report_contrast():
    pairs = [
        ("primary text on canvas", T, BG),
        ("secondary text on canvas", T2, BG),
        ("muted text on canvas", T3, BG),
        ("accent text on canvas", ACT, BG),
        ("warn text on canvas", WARN, BG),
        ("primary text on card surface", T, S),
        ("secondary text on card surface", T2, S),
        ("muted text on card surface", T3, S),
        ("accent text on card surface", ACT, S),
        ("warn text on card surface", WARN, S),
        ("secondary text on raised surface", T2, S2),
    ]
    print("\ncontrast, computed:")
    worst = 99.0
    for label, fg, bg in pairs:
        r = contrast(fg, bg)
        worst = min(worst, r)
        flag = "PASS" if r >= 4.5 else "FAIL"
        print(f"  {label:<36} {fg} on {bg}  {r:5.2f}:1  {flag}")
    print(f"  lowest measured ratio: {worst:.2f}:1")


def main():
    random.seed(20260729)
    os.makedirs(OUT, exist_ok=True)
    link_card()
    hero()
    instagram_portrait()
    instagram_square()
    facebook_feed()
    x_post()
    tiktok_cover()
    youtube_thumbnail()
    youtube_banner()
    x_header()
    facebook_cover()
    linkedin_covers()

    print(f"\nwrote {len(written)} files")
    for p in written:
        im = Image.open(p)
        print(f"  {os.path.basename(p):<40} {im.width}x{im.height}  "
              f"{os.path.getsize(p) / 1024:8.1f} KB  {im.format}")
    report_contrast()


if __name__ == "__main__":
    main()
