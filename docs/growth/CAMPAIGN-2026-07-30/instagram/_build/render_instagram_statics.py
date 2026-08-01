"""
Instagram STATIC assets, CAMPAIGN-2026-07-30.

Four feed posts at 1080x1350 (one is a 4 slide carousel, three are single
images) and four story frames at 1080x1920, one story per feed post.

Foundation: `docs/growth/grok-launch/images/_build/render_launch_images.py`.
Pillow only. No matplotlib, no cairosvg, no ImageMagick, none of which are
installed. Shapes go into 8x supersampled masks and come down with Lanczos,
the same technique that file uses.

Fonts: `_shared/fonts/` (Inter, not a system font on this machine).
Logo:   `_shared/logo/brandgeo-lockup-dark-transparent-w512.png`, downscaled
        only, never up. Clear space of at least the mark's own height on every
        side is asserted, not eyeballed.

Every drawn string is recorded in a ledger as it is drawn, together with the
colour it was drawn in and the surface colour underneath it. `verify.py` reads
that ledger, resamples the delivered PNG, and computes sRGB relative luminance
contrast from the pixels that actually landed.

Copy comes only from `docs/growth/reel-campaign-ab/run-*/instagram/NOTES.md`,
`docs/growth/reel-campaign-ab/captions/instagram.md`, and the published city
pages those NOTES cite. No claim here is new.

Run: python render_instagram_statics.py
"""

import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
IG = os.path.abspath(os.path.join(HERE, ".."))
SHARED = os.path.abspath(os.path.join(IG, "..", "_shared"))
FONTS = os.path.join(SHARED, "fonts")
LOCKUP = os.path.join(SHARED, "logo", "brandgeo-lockup-dark-transparent-w512.png")
FEED = os.path.join(IG, "feed")
STORIES = os.path.join(IG, "stories")

SS = 8  # supersample factor for shape masks

# ---------------------------------------------------------------- palette ---
# docs/growth/channel-specs-2026-07-29.md, restated in _shared/BRIEF.md sec 5.
BG = "#0a0b0e"      # canvas
S = "#101116"       # card surface
S2 = "#16171e"      # raised surface
BD = "#23242b"      # hairline border
BD2 = "#32333c"     # stronger border
AC = "#8b5cf6"      # primary violet. FILL ONLY, never a text colour.
ACS = "#7c3aed"     # CTA fill
ACT = "#a78bfa"     # accent WORDS, and the filled state of a denominator dot
T = "#e8e9ed"       # primary text
T2 = "#9ba1ac"      # secondary text
T3 = "#7d838f"      # muted text

FEED_W, FEED_H = 1080, 1350
STORY_W, STORY_H = 1080, 1920

# Instagram furniture on a story. Nothing is drawn outside this band.
STORY_SAFE_TOP = 220
STORY_SAFE_BOTTOM = STORY_H - 420  # 1500

MARGIN = 88

# Ledger of every string drawn, with its ink and the surface under it.
LEDGER = []
_current_surface = [BG]


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


# ------------------------------------------------------------ shape masks ---
def mask_rrect(w, h, radius):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def mask_rrect_outline(w, h, radius, width):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * SS - 1, h * SS - 1], radius=radius * SS,
        outline=255, width=max(1, width * SS))
    return m.resize((w, h), Image.LANCZOS)


def mask_disc(size):
    m = Image.new("L", (size * SS, size * SS), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * SS - 1, size * SS - 1], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def mask_ring(size, thickness):
    m = Image.new("L", (size * SS, size * SS), 0)
    d = ImageDraw.Draw(m)
    d.ellipse([0, 0, size * SS - 1, size * SS - 1], fill=255)
    t = thickness * SS
    d.ellipse([t, t, size * SS - 1 - t, size * SS - 1 - t], fill=0)
    return m.resize((size, size), Image.LANCZOS)


def paste_flat(base, mask, xy, colour):
    layer = Image.new("RGB", mask.size, hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, xy, mask)


# ------------------------------------------------------------------ type ----
_font_cache = {}


def font(weight, size):
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(
            os.path.join(FONTS, f"Inter-{weight}.ttf"), size)
    return _font_cache[key]


def tracked_width(s, f, tracking):
    if not tracking:
        return f.getlength(s)
    step = tracking * f.size
    return sum(f.getlength(ch) + step for ch in s) - step


def text(d, xy, s, f, fill, anchor="la", tracking=0.0, surface=None, record=True):
    """Draw one string and record it, its ink, the surface beneath it, and the
    horizontal span it occupies. The span is what `verify.py` uses to prove no
    string runs off the canvas, which is not something eyeballing catches on a
    tracked all-caps kicker."""
    if record:
        w = tracked_width(s, f, tracking)
        x0 = xy[0]
        if anchor[0] == "m":
            x0 -= w / 2.0
        elif anchor[0] == "r":
            x0 -= w
        LEDGER.append({
            "s": s,
            "ink": fill,
            "surface": surface or _current_surface[-1],
            "size": f.size,
            "xy": [int(xy[0]), int(xy[1])],
            "span": [float(x0), float(x0 + w)],
            # Vertical extent, derived from the anchor rather than guessed, so
            # verify.py can crop the region this string actually occupies.
            "vspan": [float(xy[1] - (f.size * 0.62 if anchor[1] == "m" else 0.0)),
                      float(xy[1] + (f.size * 0.62 if anchor[1] == "m"
                                     else f.size * 1.02))],
        })
    col = hexs(fill) if isinstance(fill, str) else fill
    if not tracking:
        d.text(xy, s, font=f, fill=col, anchor=anchor)
        return
    step = tracking * f.size
    total = tracked_width(s, f, tracking)
    x, y = xy
    if anchor[0] == "m":
        x -= total / 2.0
    elif anchor[0] == "r":
        x -= total
    va = anchor[1]
    for ch in s:
        d.text((x, y), ch, font=f, fill=col, anchor="l" + va)
        x += f.getlength(ch) + step


def block(d, xy, lines, f, fill, leading=1.12, tracking=0.0, surface=None):
    """Draw a stack of pre-broken lines. Returns the y below the last line."""
    x, y = xy
    lh = f.size * leading
    for i, ln in enumerate(lines):
        text(d, (x, y + i * lh), ln, f, fill, tracking=tracking, surface=surface)
    return y + (len(lines) - 1) * lh + f.size


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


def kicker(d, xy, s, max_w, start=27, tracking=0.14, colour=ACT, surface=None):
    """An all-caps tracked kicker, shrunk until it fits, and split on a comma
    onto a second line if shrinking alone would take it below legible size.
    Returns the y below the last line."""
    x, y = xy
    size = start
    while size > 21 and tracked_width(s, font("SemiBold", size), tracking) > max_w:
        size -= 1
    f = font("SemiBold", size)
    if tracked_width(s, f, tracking) <= max_w:
        text(d, (x, y), s, f, colour, tracking=tracking, surface=surface)
        return y + f.size
    parts, cur = [], ""
    for chunk in s.split(", "):
        trial = (cur + ", " + chunk) if cur else chunk
        if tracked_width(trial, f, tracking) <= max_w or not cur:
            cur = trial
        else:
            parts.append(cur)
            cur = chunk
    if cur:
        parts.append(cur)
    for i, ln in enumerate(parts):
        text(d, (x, y + i * f.size * 1.42), ln, f, colour, tracking=tracking,
             surface=surface)
    return y + (len(parts) - 1) * f.size * 1.42 + f.size


def fit_font(lines, weight, start, max_w, floor=18):
    """Largest size at which every line clears max_w. Eyeballed point sizes are
    exactly how a headline ends up running off the canvas."""
    size = start
    while size > floor and max(font(weight, size).getlength(s) for s in lines) > max_w:
        size -= 1
    return font(weight, size)


# --------------------------------------------------------------- lockup -----
_lockup_cache = None
_lockup_geom = None


def lockup_source():
    """Return the trimmed lockup RGBA plus the measured height of the MARK
    portion as a fraction of the whole, found from the horizontal ink gap
    between the mark and the wordmark. Measured, not assumed."""
    global _lockup_cache, _lockup_geom
    if _lockup_cache is None:
        im = Image.open(LOCKUP).convert("RGBA")
        im = im.crop(im.getchannel("A").getbbox())
        a = np.asarray(im)[..., 3]
        rows = (a > 16).sum(axis=1)
        # Longest run of empty rows splits mark from wordmark.
        best, cur_start, best_span = None, None, 0
        for y, v in enumerate(rows):
            if v == 0:
                if cur_start is None:
                    cur_start = y
            else:
                if cur_start is not None:
                    if y - cur_start > best_span:
                        best_span, best = y - cur_start, (cur_start, y)
                    cur_start = None
        if best is None:
            raise SystemExit("lockup: no gap found between mark and wordmark")
        _lockup_cache = im
        _lockup_geom = {
            "w": im.width, "h": im.height,
            "mark_h": best[0],          # mark occupies rows 0..best[0]
            "gap": [best[0], best[1]],
        }
    return _lockup_cache, _lockup_geom


CLEARSPACE_CHECKS = []


def draw_lockup(base, x, y, width, neighbours):
    """Paste the lockup at `width` px wide, top-left at (x, y).

    `neighbours` is the list of (x0,y0,x1,y1) boxes of other content on this
    canvas. Clear space of at least the mark's own drawn height is asserted
    against every one of them and against all four canvas edges.
    """
    src, geom = lockup_source()
    if width > geom["w"]:
        raise SystemExit(f"lockup would upscale: {width} > {geom['w']}")
    h = int(round(width * geom["h"] / geom["w"]))
    mark_h = width * geom["mark_h"] / geom["w"]
    im = src.resize((width, h), Image.LANCZOS)
    base.paste(im, (x, y), im)

    box = (x, y, x + width, y + h)
    need = mark_h
    W, H = base.size
    edges = {
        "left": x, "top": y, "right": W - (x + width), "bottom": H - (y + h),
    }
    for name, got in edges.items():
        CLEARSPACE_CHECKS.append({"vs": "canvas " + name, "need": need, "got": float(got)})
    for nb in neighbours:
        dx = max(nb[0] - box[2], box[0] - nb[2], 0)
        dy = max(nb[1] - box[3], box[1] - nb[3], 0)
        gap = max(dx, dy) if (dx or dy) else 0.0
        CLEARSPACE_CHECKS.append(
            {"vs": f"content {nb}", "need": need, "got": float(gap)})
    return box


# ----------------------------------------------------------- components -----
def card(base, x, y, w, h, radius=28, fill=S, border=BD):
    paste_flat(base, mask_rrect(w, h, radius), (x, y), fill)
    paste_flat(base, mask_rrect_outline(w, h, radius, 1), (x, y), border)
    return (x, y, x + w, y + h)


def dots(base, x, cy, filled, total, size=22, gap=13):
    """The denominator, drawn. `filled` of `total` discs lit in ACT, the rest
    left as ACT-free rings in T3. Both states are measured against 3:1 in
    verify.py, because a filled disc is a non-text indicator."""
    for i in range(total):
        px = x + i * (size + gap)
        if i < filled:
            paste_flat(base, mask_disc(size), (px, int(cy - size / 2)), ACT)
        else:
            paste_flat(base, mask_ring(size, max(2, size // 8)),
                       (px, int(cy - size / 2)), T3)
    return x + total * (size + gap) - gap


def accent_rail(base, x, y, h, w=6):
    paste_flat(base, mask_rrect(w, h, w // 2), (x, y), AC)


# ------------------------------------------------------------- canvases -----
def new_feed():
    return Image.new("RGB", (FEED_W, FEED_H), hexs(BG))


def new_story():
    return Image.new("RGB", (STORY_W, STORY_H), hexs(BG))


CONTENT_W = FEED_W - MARGIN * 2  # 904


def footer(base, d, y, lines, w=CONTENT_W, x=MARGIN, size=25, colour=T3):
    f = font("Regular", size)
    out = []
    for ln in lines:
        out.extend(wrap(ln, f, w))
    return block(d, (x, y), out, f, colour, leading=1.42)


# =========================================================== FEED POST 1 =====
# Carousel, 4 slides. run-20260730-0613. The invented firm name, recurring.
def p1_s1():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN + 40
    top = 300
    kicker(d, (cx, top), "COLLECTED 24 JULY 2026", CONTENT_W - 40)
    head = ["Two AI engines", "returned the", "same firm name."]
    f = fit_font(head, "ExtraBold", 92, CONTENT_W - 40)
    yb = block(d, (cx, top + 72), head, f, T, leading=1.10)
    acc = ["That firm", "does not exist."]
    fa = fit_font(acc, "ExtraBold", 92, CONTENT_W - 40)
    yb = block(d, (cx, yb + 62), acc, fa, ACT, leading=1.10)
    accent_rail(im, MARGIN, top, int(yb - top))
    ft = footer(im, d, int(yb) + 96, [
        "2 of the 5 engines fired, in Chicago corporate law, collected "
        "24 July 2026. Kept as reported rather than corrected.",
    ])
    draw_lockup(im, MARGIN, MARGIN, 150, [(MARGIN, top, FEED_W - MARGIN, int(ft))])
    return im, "feed-01-invented-name-s1.png"


def p1_s2():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN + 40
    top = 320
    kicker(d, (cx, top), "IT HAPPENED TWICE", CONTENT_W - 40)
    head = ["Then the identical", "name came back."]
    f = fit_font(head, "ExtraBold", 88, CONTENT_W - 40)
    yb = block(d, (cx, top + 72), head, f, T, leading=1.10)
    body = ["A second city.", "A different category.", "The same two engines."]
    fb = fit_font(body, "Medium", 56, CONTENT_W - 40)
    yb = block(d, (cx, yb + 72), body, fb, T2, leading=1.34)
    accent_rail(im, MARGIN, top, int(yb - top))
    ft = footer(im, d, int(yb) + 96, [
        "Boston biotech and life sciences law, collected 24 July 2026, the same "
        "five engines as the Chicago run.",
    ])
    draw_lockup(im, MARGIN, MARGIN, 150, [(MARGIN, top, FEED_W - MARGIN, int(ft))])
    return im, "feed-01-invented-name-s2.png"


def p1_s3():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN
    kicker(d, (cx, 300), "BOTH RUNS, COLLECTED 24 JULY 2026", CONTENT_W)
    head = ["What the two runs", "actually report"]
    f = fit_font(head, "ExtraBold", 72, CONTENT_W)
    yb = block(d, (cx, 356), head, f, T, leading=1.12)

    cy = int(yb + 58)
    ch = 470
    box = card(im, cx, cy, CONTENT_W, ch)
    _current_surface.append(S)
    rows = [
        ("5", "engines fired"),
        ("5", "returned usable data"),
        ("0", "collection errors"),
        ("2", "produced the invented name"),
        ("3", "did not"),
    ]
    fn = font("ExtraBold", 54)
    fl = font("Medium", 38)
    pad = 44
    rh = (ch - pad * 2) / len(rows)
    for i, (n, lab) in enumerate(rows):
        ry = cy + pad + rh * i + rh / 2
        text(d, (cx + pad, ry), n, fn, ACT, anchor="lm", surface=S)
        text(d, (cx + pad + 88, ry), lab, fl, T, anchor="lm", surface=S)
        if i < len(rows) - 1:
            d.line([(cx + pad, int(cy + pad + rh * (i + 1))),
                    (cx + CONTENT_W - pad, int(cy + pad + rh * (i + 1)))],
                   fill=hexs(BD2), width=1)
    _current_surface.pop()

    footer(im, d, cy + ch + 66, [
        "The five engines fired in both runs: ChatGPT, Claude, Gemini, "
        "Perplexity, Google AI Mode.",
        "Two of them produced the name. The other three did not, so the finding "
        "is narrower than it looks.",
    ])
    draw_lockup(im, MARGIN, MARGIN, 150, [(cx, 300, FEED_W - MARGIN, 1300)])
    return im, "feed-01-invented-name-s3.png"


def p1_s4():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN + 40
    top = 300
    head = ["An answer can", "sound certain", "and still be", "wrong about you."]
    f = fit_font(head, "ExtraBold", 84, CONTENT_W - 40)
    yb = block(d, (cx, top), head, f, T, leading=1.12)
    body = ("An engine that will assemble a firm name which does not exist will "
            "also assemble a near miss of one that does. Those are harder to "
            "catch, because they look correct at a glance.")
    fb = font("Regular", 38)
    yb = block(d, (cx, yb + 70), wrap(body, fb, CONTENT_W - 40), fb, T2,
               leading=1.44)
    accent_rail(im, MARGIN, top, int(yb - top))

    pill_h, pw = 96, 420
    pill_y = int(yb) + 90
    paste_flat(im, mask_rrect(pw, pill_h, pill_h // 2), (MARGIN, pill_y), ACS)
    text(d, (MARGIN + pw / 2, pill_y + pill_h / 2), "getbrandgeo.com",
         font("SemiBold", 38), T, anchor="mm", surface=ACS)
    draw_lockup(im, MARGIN, MARGIN, 150,
                [(MARGIN, top, FEED_W - MARGIN, pill_y + pill_h)])
    return im, "feed-01-invented-name-s4.png"


# =========================================================== FEED POST 2 =====
# Single. run-20260730-0013. Companies converge, individuals fragment.
def p2():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN
    kicker(d, (cx, 292), "TWO CITIES, SIX CATEGORIES EACH, 24 JULY 2026",
           CONTENT_W)
    head = ["Companies converge.", "Individuals fragment."]
    f = fit_font(head, "ExtraBold", 74, CONTENT_W)
    yb = block(d, (cx, 348), head, f, T, leading=1.12)

    cy = int(yb + 54)
    ch = 500
    card(im, cx, cy, CONTENT_W, ch)
    _current_surface.append(S)
    groups = [
        ("PROPERTY MANAGEMENT", [("Boston", 5), ("Houston", 4)]),
        ("REAL ESTATE AGENTS", [("Boston", 2), ("Houston", 2)]),
    ]
    pad = 44
    y = cy + pad
    fg = font("SemiBold", 25)
    fc = font("Medium", 40)
    fv = font("SemiBold", 34)
    for gi, (title, rows) in enumerate(groups):
        text(d, (cx + pad, y), title, fg, T3, tracking=0.14, surface=S)
        y += 52
        for city, n in rows:
            text(d, (cx + pad, y + 22), city, fc, T, anchor="lm", surface=S)
            dots(im, cx + pad + 230, y + 22, n, 5)
            text(d, (cx + CONTENT_W - pad, y + 22), f"{n} of 5", fv, ACT,
                 anchor="rm", surface=S)
            y += 62
        if gi == 0:
            y += 14
            d.line([(cx + pad, y), (cx + CONTENT_W - pad, y)],
                   fill=hexs(BD2), width=1)
            y += 32
    _current_surface.pop()

    footer(im, d, cy + ch + 56, [
        "Engine agreement counts how many of the 5 engines tested independently "
        "named the same brand.",
        "Boston and Houston, 6 categories each, one collection pass, collected "
        "24 July 2026. Engines: ChatGPT, Claude, Gemini, Perplexity, "
        "Google AI Mode.",
    ])
    draw_lockup(im, MARGIN, MARGIN, 150, [(cx, 292, FEED_W - MARGIN, 1310)])
    return im, "feed-02-converge-fragment.png"


# =========================================================== FEED POST 3 =====
# Single. run-20260730-0113. Top answer on several engines, zero on another.
def p3():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN
    kicker(d, (cx, 296), "ONE BRAND AUDIT, 20 QUESTIONS, PUBLISHED 2 JULY 2026",
           CONTENT_W)
    head = ["Top answer on", "several engines.", "Zero mentions", "on another."]
    f = fit_font(head, "ExtraBold", 82, CONTENT_W)
    yb = block(d, (cx, 356), head, f, T, leading=1.11)

    y = int(yb + 56)
    fb = font("Regular", 38)
    y = block(d, (cx, y), wrap(
        "Same brand. The same 20 questions, run identically across every "
        "engine in that audit.", fb, CONTENT_W), fb, T2, leading=1.44)

    y = int(y + 54)
    ch = 190
    card(im, cx, y, CONTENT_W, ch, fill=S2, border=BD2)
    _current_surface.append(S2)
    acc = ["First on the page is not the same", "as named in the answer."]
    fa = fit_font(acc, "SemiBold", 44, CONTENT_W - 88)
    block(d, (cx + 44, y + 48), acc, fa, ACT, leading=1.30, surface=S2)
    _current_surface.pop()

    footer(im, d, y + ch + 56, [
        "BrandGEO Research BG-004, published 2 July 2026. That audit ran on an "
        "engine lineup which is not the one BrandGEO runs today, so no engine "
        "count is given here.",
    ])
    draw_lockup(im, MARGIN, MARGIN, 150, [(cx, 296, FEED_W - MARGIN, 1300)])
    return im, "feed-03-first-and-absent.png"


# =========================================================== FEED POST 4 =====
# Single. run-20260730-0216. One prompt, five engines, the ranks published.
def p4():
    im = new_feed()
    d = ImageDraw.Draw(im)
    cx = MARGIN
    kicker(d, (cx, 288), "ONE PROMPT, FIVE ENGINES, ONE DAY", CONTENT_W)

    y = 340
    qh = 224
    card(im, cx, y, CONTENT_W, qh, fill=S2, border=BD2)
    _current_surface.append(S2)
    accent_rail(im, cx + 36, y + 40, qh - 80, 5)
    fq = font("SemiBold", 46)
    prompt = '"Top-rated property management companies in Chicago"'
    block(d, (cx + 72, y + 44), wrap(prompt, fq, CONTENT_W - 130), fq, T,
          leading=1.26, surface=S2)
    _current_surface.pop()

    y = y + qh + 40
    ch = 400
    card(im, cx, y, CONTENT_W, ch)
    _current_surface.append(S)
    rows = [("ChatGPT", "#1"), ("Claude", "#1"), ("Perplexity", "#2"),
            ("Gemini", "#4"), ("Google AI Mode", "named")]
    pad = 42
    rh = (ch - pad * 2) / len(rows)
    fe = font("Medium", 38)
    fr = font("ExtraBold", 40)
    for i, (eng, rank) in enumerate(rows):
        ry = y + pad + rh * i + rh / 2
        text(d, (cx + pad, ry), eng, fe, T, anchor="lm", surface=S)
        text(d, (cx + CONTENT_W - pad, ry), rank,
             fr if rank.startswith("#") else font("SemiBold", 32),
             ACT, anchor="rm", surface=S)
        if i < len(rows) - 1:
            d.line([(cx + pad, int(y + pad + rh * (i + 1))),
                    (cx + CONTENT_W - pad, int(y + pad + rh * (i + 1)))],
                   fill=hexs(BD2), width=1)
    _current_surface.pop()

    y = y + ch + 42
    line = ["Named by all five.", "Ranked anywhere from #1 to #4."]
    fl = fit_font(line, "ExtraBold", 52, CONTENT_W)
    y = block(d, (cx, y), line, fl, T, leading=1.16)

    footer(im, d, y + 40, [
        "Collected 24 July 2026. The prompt, the engines, the ranks and the "
        "date are published in full. These systems are not deterministic, so a "
        "rerun can move the ranks.",
    ])
    draw_lockup(im, MARGIN, MARGIN, 150, [(cx, 288, FEED_W - MARGIN, 1320)])
    return im, "feed-04-one-prompt-five-engines.png"


# ============================================================== STORIES ======
STORY_BOUNDS = []

# Height reserved at the bottom of the safe band for Instagram's own link
# sticker. Nothing is ever drawn inside it.
STICKER_H = 160


def story(kick, head_lines, sub, fname, head_start=96):
    """Measure first, place second, so a wrapped sub-line can never collide
    with the CTA. The block is bottom-aligned against the sticker zone, which
    also keeps all four frames visually consistent."""
    im = new_story()
    d = ImageDraw.Draw(im)
    cx = MARGIN + 40
    # 156px wide puts the mark at 156 * 280/512 = 85.3px tall, so the required
    # clear space stays under the 88px canvas margin. At 168 it was 91.9 and
    # the left edge was 4px short, which verify.py caught.
    lock = draw_lockup(im, MARGIN, STORY_SAFE_TOP + 40, 156, [])

    fh = fit_font(head_lines, "ExtraBold", head_start, CONTENT_W - 40)
    fs = font("Regular", 38)
    sub_lines = wrap(sub, fs, CONTENT_W - 40)
    pill_h, pw = 100, 440

    gap_k, gap_s, gap_p = 74, 60, 84
    h_k = 27
    h_h = fh.size * 1.11 * (len(head_lines) - 1) + fh.size
    h_s = fs.size * 1.44 * (len(sub_lines) - 1) + fs.size
    total = gap_k + h_h + gap_s + h_s + gap_p + pill_h

    bottom = STORY_SAFE_BOTTOM - STICKER_H
    top = int(bottom - total)
    lock_floor = lock[3] + (156 * lockup_source()[1]["mark_h"] / 512.0)
    if top < lock_floor:
        raise SystemExit(f"{fname}: story block starts at {top}, above the "
                         f"lockup clear-space floor {lock_floor:.0f}")

    kicker(d, (cx, top), kick, CONTENT_W - 40)
    yb = block(d, (cx, top + gap_k), head_lines, fh, T, leading=1.11)
    yb = block(d, (cx, yb + gap_s), sub_lines, fs, T2, leading=1.44)
    accent_rail(im, MARGIN, top, int(yb - top))

    pill_y = int(yb + gap_p)
    paste_flat(im, mask_rrect(pw, pill_h, pill_h // 2), (MARGIN, pill_y), ACS)
    text(d, (MARGIN + pw / 2, pill_y + pill_h / 2), "getbrandgeo.com",
         font("SemiBold", 40), T, anchor="mm", surface=ACS)

    STORY_BOUNDS.append({
        "file": fname,
        "highest_ink_y": int(lock[1]),
        "lowest_ink_y": int(pill_y + pill_h),
        "sticker_zone": [int(pill_y + pill_h + 20), STORY_SAFE_BOTTOM],
        "block_top": top,
        "h_k": h_k,
    })
    return im, fname


# ================================================================= main ======
def main():
    os.makedirs(FEED, exist_ok=True)
    os.makedirs(STORIES, exist_ok=True)

    src, geom = lockup_source()
    print(f"lockup source {geom['w']}x{geom['h']}, mark rows 0..{geom['mark_h']}, "
          f"gap {geom['gap']}")

    jobs = [(p1_s1, FEED), (p1_s2, FEED), (p1_s3, FEED), (p1_s4, FEED),
            (p2, FEED), (p3, FEED), (p4, FEED)]

    manifest = []
    for fn, out in jobs:
        start = len(LEDGER)
        im, name = fn()
        path = os.path.join(out, name)
        im.save(path, "PNG")
        manifest.append({"file": path, "w": im.width, "h": im.height,
                         "ledger": LEDGER[start:]})
        print(f"  wrote {name} {im.width}x{im.height}")

    stories = [
        ("2 OF 5 ENGINES, COLLECTED 24 JULY 2026",
         ["Two AI engines", "returned a firm name", "that does not exist."],
         "Then the identical name came back in a second city, in a different "
         "category, from the same two engines.",
         "story-01-invented-name.png", 84),
        ("TWO CITIES, SIX CATEGORIES EACH, 24 JULY 2026",
         ["Companies converge.", "Individuals fragment."],
         "Property management reached 5 of 5 engines in Boston and 4 of 5 in "
         "Houston. Real estate agents reached 2 of 5 in both.",
         "story-02-converge-fragment.png", 76),
        ("ONE BRAND AUDIT, 20 QUESTIONS, PUBLISHED 2 JULY 2026",
         ["Top answer on", "several engines.", "Zero mentions", "on another."],
         "Same brand, the same 20 questions, run identically across every "
         "engine in that audit.",
         "story-03-first-and-absent.png", 80),
        ("ONE PROMPT, FIVE ENGINES, 24 JULY 2026",
         ["Named by all five.", "Ranked anywhere", "from #1 to #4."],
         "The prompt, the engines, the ranks and the collection date are "
         "published in full.",
         "story-04-one-prompt-five-engines.png", 80),
    ]
    for k, h, s, name, hs in stories:
        start = len(LEDGER)
        im, nm = story(k, h, s, name, hs)
        path = os.path.join(STORIES, nm)
        im.save(path, "PNG")
        manifest.append({"file": path, "w": im.width, "h": im.height,
                         "ledger": LEDGER[start:]})
        print(f"  wrote {nm} {im.width}x{im.height}")

    with open(os.path.join(HERE, "ledger.json"), "w", encoding="utf-8") as fh:
        json.dump({"images": manifest,
                   "clearspace": CLEARSPACE_CHECKS,
                   "story_bounds": STORY_BOUNDS,
                   "tokens": {"BG": BG, "S": S, "S2": S2, "BD": BD, "BD2": BD2,
                              "AC": AC, "ACS": ACS, "ACT": ACT,
                              "T": T, "T2": T2, "T3": T3},
                   "story_safe": [STORY_SAFE_TOP, STORY_SAFE_BOTTOM]}, fh, indent=1)
    print(f"\n{len(manifest)} images, {len(LEDGER)} recorded strings, "
          f"{len(CLEARSPACE_CHECKS)} clear-space checks")


if __name__ == "__main__":
    main()
