"""
CAMPAIGN-2026-07-30: the X and Threads static images.

Four 1600x900 for X (two thread openers, two standalones) and four 1080x1350
for Threads. Pillow only. No matplotlib, no cairosvg, no ImageMagick, none of
which are installed.

Built on `docs/growth/grok-launch/images/_build/render_launch_images.py`: same
8x supersampled shape masks downsampled with Lanczos, same colour-maths
helpers, same auto-fit-rather-than-eyeball rule for type. What is new here:

1. **A declared-rect registry.** Every element records the rectangle it draws
   into. The lockup clear-space rule is then checked against those rects rather
   than against measured pixels, because a pixel measurement is blind to
   anything drawn near the canvas value (a lesson paid for in the reel campaign,
   `reel-campaign-ab/00-CAMPAIGN-BRIEF.md`).

2. **A legibility budget.** X renders a 16:9 image at roughly 400 to 600 CSS px
   wide in-timeline, so a 1600px master is displayed at about 0.25x to 0.375x.
   Every type size is checked against its EFFECTIVE size at that scale, not at
   100 percent, and the run fails if anything lands under the floor.

3. **Contrast reported per actual pairing**, foreground against the surface it
   really sits on, sRGB relative luminance.

Tokens are from `_shared/BRIEF.md` section 5. `#8b5cf6` is a fill and is never
passed as a text colour; a guard enforces that.

Run: python render_campaign_images.py
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
X_OUT = os.path.abspath(os.path.join(HERE, "..", "images"))
TH_OUT = os.path.abspath(os.path.join(HERE, "..", "..", "threads", "images"))
SHARED = os.path.abspath(os.path.join(HERE, "..", "..", "_shared"))
FONTS = os.path.join(SHARED, "fonts")
LOCKUP = os.path.join(SHARED, "logo", "brandgeo-lockup-dark-transparent-w512.png")

SS = 8  # supersample factor for shape masks

# ---------------------------------------------------------------- palette ---
BG = "#0a0b0e"      # canvas
S = "#101116"       # card surface
S2 = "#16171e"      # raised surface
BD = "#23242b"      # hairline border
BD2 = "#32333c"     # stronger border
AC = "#8b5cf6"      # primary violet, FILL ONLY, never text
ACS = "#7c3aed"     # CTA fill
ACT = "#a78bfa"     # accent WORDS
T = "#e8e9ed"       # primary text
T2 = "#9ba1ac"      # secondary text
T3 = "#7d838f"      # muted text
OK = "#34d399"
PART = "#fb923c"
BAD = "#f87171"
WARN = "#fbbf24"

GRAD = [(0.00, "#6366F1"), (0.55, "#8B5CF6"), (1.00, "#7C3AED")]

# Text colours are whitelisted. AC is a fill and passing it to text() raises.
TEXT_OK = {ACT, T, T2, T3, OK, PART, BAD, WARN}

# Effective-size floors. X in-timeline reference width is 500 CSS px on a
# 1600 px master, so scale 0.3125. Threads in-feed reference is 500 CSS px on a
# 1080 px master, so scale 0.463. The floor is the smallest effective size that
# is still readable rather than merely present.
X_SCALE = 500.0 / 1600.0
TH_SCALE = 500.0 / 1080.0
EFFECTIVE_FLOOR = 11.0


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


def paste_flat(base, mask, xy, colour):
    layer = Image.new("RGB", mask.size,
                      hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, xy, mask)


def paste_grad(base, mask, xy, vertical=False):
    base.paste(grad_image(mask.size[0], mask.size[1], vertical), xy, mask)


def vignette(base, cx, cy, radius, colour=AC, strength=0.15):
    """Soft off-canvas bloom. Background, not ink: it never carries meaning and
    is kept low enough that flat fields stay flat."""
    w, h = base.size
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - cx) / radius) ** 2 + ((yy - cy) / radius) ** 2)
    a = np.clip(1.0 - r, 0, 1) ** 2 * strength
    c = np.array(hexs(colour), dtype=np.float32)
    b = np.asarray(base).astype(np.float32)
    base.paste(Image.fromarray(np.clip(b + a[..., None] * c, 0, 255).astype(np.uint8)),
               (0, 0))


# ------------------------------------------------------------------ type ----
_font_cache = {}


def font(weight, size):
    key = (weight, int(size))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(
            os.path.join(FONTS, f"Inter-{weight}.ttf"), int(size))
    return _font_cache[key]


# --------------------------------------------------- the asset being built ---
class Asset:
    """One image plus its declared rects, its type inventory and its surface
    map. Everything drawn is registered, so the checks below run on what was
    declared rather than on what a pixel threshold happens to be able to see."""

    def __init__(self, name, w, h, scale, out_dir):
        self.name = name
        self.w, self.h = w, h
        self.scale = scale          # in-feed display scale
        self.out_dir = out_dir
        self.im = Image.new("RGB", (w, h), hexs(BG))
        self.d = ImageDraw.Draw(self.im)
        self.rects = []             # (tag, x0, y0, x1, y1)
        self.type_items = []        # (tag, size_px, fill, surface)
        self.strings = []           # every string drawn, for the scanners
        self.contain = []           # (tag, textrect, boxrect) containment claims

    # -- registry ---------------------------------------------------------
    def rect(self, tag, x0, y0, x1, y1):
        self.rects.append((tag, int(x0), int(y0), int(x1), int(y1)))

    # -- primitives -------------------------------------------------------
    def card(self, x, y, w, h, fill=S, radius=22, border=BD, inset=40):
        m = mask_rrect(w, h, radius)
        paste_flat(self.im, m, (x, y), fill)
        if border:
            edge = Image.new("L", (w, h), 0)
            ImageDraw.Draw(edge).rounded_rectangle(
                [0, 0, w - 1, h - 1], radius=radius, outline=255, width=2)
            paste_flat(self.im, edge, (x, y), border)
        self.rect("card", x, y, x + w, y + h)
        # The box any text drawn onto this card must stay inside.
        return (x + inset, y + inset // 2, x + w - inset, y + h - inset // 2)

    def bar(self, x, y, w, h, fill=ACS, radius=None):
        r = h // 2 if radius is None else radius
        paste_flat(self.im, mask_rrect(w, h, r), (int(x), int(y)), fill)
        self.rect("bar", x, y, x + w, y + h)

    def text(self, tag, xy, s, f, fill, surface=BG, anchor="la", tracking=0.0,
             box=None):
        if fill not in TEXT_OK:
            raise ValueError(f"{fill} is a fill colour and must never be text ({tag})")
        x, y = xy
        col = hexs(fill)
        if tracking:
            step = tracking * f.size
            total = sum(f.getlength(ch) + step for ch in s) - step
            if anchor[0] == "m":
                x -= total / 2.0
            elif anchor[0] == "r":
                x -= total
            va = anchor[1]
            cx = x
            for ch in s:
                self.d.text((cx, y), ch, font=f, fill=col, anchor="l" + va)
                cx += f.getlength(ch) + step
            w = total
        else:
            self.d.text((x, y), s, font=f, fill=col, anchor=anchor)
            w = f.getlength(s)
            if anchor[0] == "m":
                x -= w / 2.0
            elif anchor[0] == "r":
                x -= w
        asc, desc = f.getmetrics()
        top = y if anchor[1] in "at" else (y - asc if anchor[1] == "s"
                                           else y - (asc + desc) / 2)
        self.rect(f"text:{tag}", x, top, x + w, top + asc + desc)
        self.type_items.append((tag, f.size, fill, surface))
        self.strings.append(s)
        tr = (x, top, x + w, top + asc + desc)
        # Every run of type has to fit something: the card it sits on if it has
        # one, otherwise the canvas minus its own padding. An overflowing
        # header is invisible to a contrast check and to a legibility check.
        self.contain.append((tag, tr, box if box else (0, 0, self.w, self.h)))
        return w

    def block(self, tag, xy, lines, f, fill, surface=BG, leading=1.10,
              anchor="la", tracking=0.0, box=None):
        x, y = xy
        lh = f.size * leading
        for i, ln in enumerate(lines):
            self.text(tag, (x, y + i * lh), ln, f, fill, surface=surface,
                      anchor=anchor, tracking=tracking, box=box)
        return y + len(lines) * lh

    # -- the lockup -------------------------------------------------------
    def lockup(self, x, y, height, anchor="lb"):
        """Place the shared lockup and register BOTH its own rect and the
        clear-space exclusion rect around it.

        The lockup is stacked: mark above wordmark. Its mark band is measured
        from the source alpha rather than assumed, so the clear space is the
        mark's OWN height as the brief requires, not the whole lockup's."""
        src = Image.open(LOCKUP).convert("RGBA")
        src = src.crop(src.getchannel("A").getbbox())
        if height > src.height:
            raise ValueError(f"upscaling the lockup {src.height} -> {height}")
        a = np.asarray(src.getchannel("A"))
        rows = (a > 8).sum(1)
        bands, run = [], None
        for i, v in enumerate(rows):
            if v > 0 and run is None:
                run = i
            elif v == 0 and run is not None:
                bands.append((run, i - 1))
                run = None
        if run is not None:
            bands.append((run, len(rows) - 1))
        mark_frac = (bands[0][1] - bands[0][0] + 1) / src.height

        w = int(round(height * src.width / src.height))
        im = src.resize((w, int(height)), Image.LANCZOS)
        px = x if anchor[0] == "l" else x - w
        py = y if anchor[1] == "t" else y - int(height)
        self.im.paste(im, (int(px), int(py)), im)
        self.rect("lockup", px, py, px + w, py + height)

        clear = mark_frac * height
        self.rect("lockup:clearspace", px - clear, py - clear,
                  px + w + clear, py + height + clear)
        self.lockup_box = (px, py, px + w, py + height, clear, mark_frac)
        return w

    # -- checks -----------------------------------------------------------
    def check_lockup_clearspace(self):
        px, py, qx, qy, clear, frac = self.lockup_box
        ex0, ey0, ex1, ey1 = px - clear, py - clear, qx + clear, qy + clear
        problems = []
        if ex0 < 0 or ey0 < 0 or ex1 > self.w or ey1 > self.h:
            problems.append(
                f"clear space runs off canvas: exclusion "
                f"({ex0:.0f},{ey0:.0f})-({ex1:.0f},{ey1:.0f}) vs {self.w}x{self.h}")
        for tag, x0, y0, x1, y1 in self.rects:
            if tag.startswith("lockup"):
                continue
            if x0 < ex1 and x1 > ex0 and y0 < ey1 and y1 > ey0:
                problems.append(f"{tag} at ({x0},{y0})-({x1},{y1}) intrudes")
        return clear, frac, problems

    def check_containment(self):
        bad = []
        for tag, (x0, y0, x1, y1), (bx0, by0, bx1, by1) in self.contain:
            if x0 < bx0 - 1 or x1 > bx1 + 1 or y0 < by0 - 1 or y1 > by1 + 1:
                bad.append(f"{tag} ({x0:.0f},{y0:.0f})-({x1:.0f},{y1:.0f}) "
                           f"outside ({bx0:.0f},{by0:.0f})-({bx1:.0f},{by1:.0f})")
        return bad

    def check_collisions(self):
        """Union rect per tag, then pairwise intersection.

        Per-LINE rects cannot be used for this: Inter's ascent plus descent is
        about 1.21 em while the leading here is 1.04 to 1.34 em, so consecutive
        lines of one block always overlap as boxes and a naive pairwise test
        fires on every asset. Grouping by tag is what makes the check able to
        distinguish a block from a genuine collision between two blocks."""
        groups = {}
        for tag, x0, y0, x1, y1 in self.rects:
            if not tag.startswith("text:"):
                continue
            k = tag[5:]
            if k in groups:
                a, b, c, d = groups[k]
                groups[k] = (min(a, x0), min(b, y0), max(c, x1), max(d, y1))
            else:
                groups[k] = (x0, y0, x1, y1)
        keys = sorted(groups)
        bad = []
        for i in range(len(keys)):
            for j in range(i + 1, len(keys)):
                ax0, ay0, ax1, ay1 = groups[keys[i]]
                bx0, by0, bx1, by1 = groups[keys[j]]
                if ax0 < bx1 and ax1 > bx0 and ay0 < by1 and ay1 > by0:
                    bad.append(f"{keys[i]} and {keys[j]} overlap")
        return bad

    def check_legibility(self):
        bad = []
        for tag, size, fill, surface in self.type_items:
            eff = size * self.scale
            if eff < EFFECTIVE_FLOOR:
                bad.append((tag, size, eff))
        return bad

    def contrast_rows(self):
        seen, rows = set(), []
        for tag, size, fill, surface in self.type_items:
            key = (fill, surface)
            if key in seen:
                continue
            seen.add(key)
            large = size >= 37  # 28pt at 96dpi, the WCAG large-text threshold
            r = contrast(fill, surface)
            need = 3.0 if large else 4.5
            rows.append((fill, surface, r, need, r >= need, size))
        return rows

    def save(self):
        p = os.path.join(self.out_dir, self.name)
        self.im.save(p, "PNG", optimize=True)
        return p


# ================================================================ assets ====
def _headline_font(lines, weight, start, max_w, floor=40):
    size = start
    while size > floor and max(font(weight, size).getlength(s) for s in lines) > max_w:
        size -= 2
    return font(weight, size)


# ------------------------------------------------------------------- X ------
# The lockup sits TOP RIGHT on every asset. Bottom placement was tried first
# and failed the clear-space check on all eight: a stacked lockup needs its
# mark's height clear on four sides, which is about 70 px at this scale, and
# the bottom of a 16:9 is where the supporting line and the card edges live.
# Top right is the only corner that is empty by construction on both canvases.
X_PAD, X_LOCK_H = 96, 104
TH_PAD, TH_LOCK_H = 88, 104
X_TOP = 300          # content starts below the lockup exclusion band
TH_TOP = 292


def x_thread_a():
    """Thread A opener. The fabricated firm. Type only: the claim is the
    graphic, and anything else on a 16:9 shown at a third size is noise."""
    a = Asset("x-thread-a-firm-that-does-not-exist-1600x900.png", 1600, 900,
              X_SCALE, X_OUT)
    vignette(a.im, 1600 * 0.86, 900 * 0.08, 1600 * 0.66, AC, 0.15)
    pad = X_PAD
    a.lockup(1600 - pad, 88, X_LOCK_H, anchor="rt")
    col = 1600 - pad * 2

    a.text("eyebrow", (pad, 104), "CHICAGO AND BOSTON, 24 JULY 2026",
           font("SemiBold", 38), ACT, tracking=0.15)

    l1 = ["Two of five engines", "named the same firm."]
    f = _headline_font(l1, "ExtraBold", 84, col)
    y = a.block("headline", (pad, X_TOP - 36), l1, f, T, leading=1.06)
    y = a.block("headline", (pad, y + 6), ["That firm does not exist."],
                f, ACT, leading=1.06)

    a.bar(pad, y + 44, 168, 10)

    a.block("support", (pad, y + 96),
            ["Five engines fired in each run. Five returned",
             "usable data. No collection errors in either city."],
            font("Medium", 44), T2, leading=1.32)

    a.text("url", (pad, 900 - pad + 6), "getbrandgeo.com",
           font("Medium", 38), T3, anchor="lb")
    return a


def x_thread_b():
    """Thread B opener. Language picked the shortlist. Two cards side by side,
    because the finding IS a substitution and a substitution wants two boxes."""
    a = Asset("x-thread-b-language-picked-the-shortlist-1600x900.png", 1600, 900,
              X_SCALE, X_OUT)
    vignette(a.im, 1600 * 0.12, 900 * 0.94, 1600 * 0.7, AC, 0.14)
    pad = X_PAD
    a.lockup(1600 - pad, 88, X_LOCK_H, anchor="rt")

    a.text("eyebrow", (pad, 104), "PARIS, COLLECTED 10 JULY 2026",
           font("SemiBold", 38), ACT, tracking=0.15)

    l1 = ["One question, asked twice."]
    f = _headline_font(l1, "ExtraBold", 84, 1600 - pad * 2)
    y = a.block("headline", (pad, X_TOP - 40), l1, f, T, leading=1.06)
    y = a.block("headline", (pad, y + 4), ["Two different sets of firms."],
                f, ACT, leading=1.06)

    cy = int(y) + 52
    ch = 900 - pad - cy
    cw = (1600 - pad * 2 - 40) // 2
    for i, (label, line1, line2) in enumerate([
            ("ASKED IN FRENCH", "Independent", "boutique French firms."),
            ("ASKED IN ENGLISH", "Large international", "private banks."),
    ]):
        cx = pad + i * (cw + 40)
        surf = S if i == 0 else S2
        bx = a.card(cx, cy, cw, ch, fill=surf)
        a.text(f"card{i}-label", (cx + 40, cy + 34), label,
               font("SemiBold", 38), T3 if i == 0 else ACT, surface=surf,
               tracking=0.13, box=bx)
        a.block(f"card{i}-body", (cx + 40, cy + 100), [line1, line2],
                font("Bold", 50), T, surface=surf, leading=1.20, box=bx)
    return a


def x_standalone_1():
    """Standalone 1. The artefact: one prompt, five engines, five results,
    including the row that weakens the story."""
    a = Asset("x-standalone-1-one-question-five-engines-1600x900.png", 1600, 900,
              X_SCALE, X_OUT)
    vignette(a.im, 1600 * 0.08, 900 * 0.92, 1600 * 0.6, AC, 0.13)
    pad = X_PAD
    a.lockup(1600 - pad, 88, X_LOCK_H, anchor="rt")
    left_w = 660

    a.text("eyebrow", (pad, 104), "CHICAGO, 24 JULY 2026",
           font("SemiBold", 38), ACT, tracking=0.15)

    l1 = ["One question.", "Five engines."]
    f = _headline_font(l1, "ExtraBold", 84, left_w)
    y = a.block("headline", (pad, X_TOP - 26), l1, f, T, leading=1.05)

    a.bar(pad, y + 30, 150, 10)

    a.block("prompt", (pad, y + 82),
            ['"Top-rated property', 'management companies', 'in Chicago"'],
            font("Medium", 46), T2, leading=1.26)

    # The result card. Right-aligned rank column at a fixed edge so the ranks
    # read as one column rather than five separate words.
    cx, cw = pad + left_w + 56, 1600 - pad - (pad + left_w + 56)
    cy, ch = X_TOP - 26, 900 - pad - (X_TOP - 26)
    bx = a.card(cx, cy, cw, ch, fill=S)
    a.text("table-head", (cx + 40, cy + 34), "WHERE IT LANDED",
           font("SemiBold", 38), T3, surface=S, tracking=0.12, box=bx)
    rows = [("ChatGPT", "1st"), ("Claude", "1st"), ("Perplexity", "2nd"),
            ("Gemini", "4th"), ("Google AI Mode", "named")]
    ry = cy + 104
    rh = (ch - 140) / len(rows)
    fn = font("Medium", 44)
    fr = font("SemiBold", 44)
    for i, (name, rank) in enumerate(rows):
        my = ry + i * rh + rh * 0.5
        a.text("row-engine", (cx + 40, my), name, fn, T, surface=S, anchor="lm",
               box=bx)
        a.text("row-rank", (cx + cw - 40, my), rank, fr,
               T2 if rank == "named" else ACT, surface=S, anchor="rm", box=bx)
        if i < len(rows) - 1:
            a.d.line([(cx + 40, ry + (i + 1) * rh), (cx + cw - 40, ry + (i + 1) * rh)],
                     fill=hexs(BD), width=2)
            a.rect("rule", cx + 40, ry + (i + 1) * rh, cx + cw - 40,
                   ry + (i + 1) * rh + 2)
    return a


def x_standalone_2():
    """Standalone 2. What a 5 of 5 actually counts. Our own figure, read the
    way a reader would misread it, then corrected."""
    a = Asset("x-standalone-2-what-a-five-of-five-counts-1600x900.png", 1600, 900,
              X_SCALE, X_OUT)
    vignette(a.im, 1600 * 0.10, 900 * 0.12, 1600 * 0.62, AC, 0.14)
    pad = X_PAD
    a.lockup(1600 - pad, 88, X_LOCK_H, anchor="rt")
    right_w = 700

    a.text("eyebrow", (pad, 104), "OUR OWN ROME RUN, 10 JULY 2026",
           font("SemiBold", 38), ACT, tracking=0.15)

    l1 = ["Not five engines", "agreeing."]
    f = _headline_font(l1, "ExtraBold", 88, 1600 - pad * 2 - right_w - 60)
    y = a.block("headline", (pad, X_TOP - 20), l1, f, T, leading=1.05)
    a.bar(pad, y + 30, 150, 10)
    a.block("support", (pad, y + 82),
            ["Ask what the five counts", "before you read it", "as consensus."],
            font("Medium", 44), T2, leading=1.28)

    cx, cw = 1600 - pad - right_w, right_w
    cy, ch = X_TOP - 20, 900 - pad - (X_TOP - 20)
    bx = a.card(cx, cy, cw, ch, fill=S)
    a.text("table-head", (cx + 40, cy + 34), "WHAT THE 5 OF 5 COUNTS",
           font("SemiBold", 36), T3, surface=S, tracking=0.12, box=bx)
    rows = [("5 restaurants", "of 5"), ("1 engine", ""), ("2 languages", "")]
    ry = cy + 110
    rh = (ch - 150) / len(rows)
    for i, (a1, a2) in enumerate(rows):
        my = ry + i * rh + rh * 0.5
        w = a.text("row", (cx + 40, my), a1, font("Bold", 48), T, surface=S,
                   anchor="lm", box=bx)
        if a2:
            a.text("row-sub", (cx + 40 + w + 14, my + 2), a2,
                   font("Medium", 42), T2, surface=S, anchor="lm", box=bx)
        if i < len(rows) - 1:
            a.d.line([(cx + 40, ry + (i + 1) * rh), (cx + cw - 40, ry + (i + 1) * rh)],
                     fill=hexs(BD), width=2)
            a.rect("rule", cx + 40, ry + (i + 1) * rh, cx + cw - 40,
                   ry + (i + 1) * rh + 2)
    return a


# ------------------------------------------------------------- Threads ------
def _th_open(name, vig, eyebrow):
    a = Asset(name, 1080, 1350, TH_SCALE, TH_OUT)
    vignette(a.im, *vig)
    a.lockup(1080 - TH_PAD, 80, TH_LOCK_H, anchor="rt")
    a.text("eyebrow", (TH_PAD, 96), eyebrow, font("SemiBold", 28), ACT,
           tracking=0.14)
    return a


def _th_close(a):
    a.text("url", (TH_PAD, 1350 - TH_PAD + 4), "getbrandgeo.com",
           font("Medium", 34), T3, anchor="lb")


def th_converge():
    a = _th_open("threads-1-companies-converge-1080x1350.png",
                 (1080 * 0.85, 1350 * 0.06, 1080 * 0.9, AC, 0.15),
                 "BOSTON AND HOUSTON, 24 JULY 2026")
    pad = TH_PAD

    l1 = ["Companies", "converge."]
    f = _headline_font(l1, "ExtraBold", 100, 1080 - pad * 2)
    y = a.block("headline", (pad, TH_TOP), l1, f, T, leading=1.04)
    y = a.block("headline", (pad, y + 2), ["Individuals", "fragment."],
                f, ACT, leading=1.04)

    cy = int(y) + 54
    ch = 1350 - pad - 92 - cy
    bx = a.card(pad, cy, 1080 - pad * 2, ch, fill=S)
    a.text("table-head", (pad + 40, cy + 34), "ENGINES AGREEING",
           font("SemiBold", 30), T3, surface=S, tracking=0.11, box=bx)
    a.text("col-b", (pad + 580, cy + 34), "BOSTON", font("SemiBold", 30), T3,
           surface=S, anchor="ma", tracking=0.11, box=bx)
    a.text("col-h", (pad + 776, cy + 34), "HOUSTON", font("SemiBold", 30), T3,
           surface=S, anchor="ma", tracking=0.11, box=bx)

    rows = [("Property management", "5 of 5", "4 of 5"),
            ("Real estate agents", "2 of 5", "2 of 5")]
    ry = cy + 106
    rh = (ch - 146) / len(rows)
    for i, (name, b, h) in enumerate(rows):
        my = ry + i * rh + rh * 0.5
        a.text("row-cat", (pad + 40, my), name, font("Medium", 40), T,
               surface=S, anchor="lm", box=bx)
        big = font("Bold", 44)
        a.text("row-b", (pad + 580, my), b, big, ACT if i == 0 else T2,
               surface=S, anchor="mm", box=bx)
        a.text("row-h", (pad + 776, my), h, big, ACT if i == 0 else T2,
               surface=S, anchor="mm", box=bx)
        if i < len(rows) - 1:
            a.d.line([(pad + 40, ry + (i + 1) * rh),
                      (1080 - pad - 40, ry + (i + 1) * rh)], fill=hexs(BD), width=2)
            a.rect("rule", pad + 40, ry + (i + 1) * rh, 1080 - pad - 40,
                   ry + (i + 1) * rh + 2)
    _th_close(a)
    return a


def th_emoji():
    a = _th_open("threads-2-an-emoji-changed-the-score-1080x1350.png",
                 (1080 * 0.15, 1350 * 0.96, 1080 * 0.9, AC, 0.15),
                 "A BUG IN OUR OWN SCORING")
    pad = TH_PAD

    l1 = ["Same answer.", "Same praise."]
    f = _headline_font(l1, "ExtraBold", 96, 1080 - pad * 2)
    y = a.block("headline", (pad, TH_TOP), l1, f, T, leading=1.04)
    y = a.block("headline", (pad, y + 2), ["Different score."], f, ACT,
                leading=1.04)

    cy = int(y) + 52
    gap = 26
    ch = (1350 - pad - 92 - cy - gap) // 2
    for i, (label, l_a, l_b, col) in enumerate([
            ("HEADING WITH A MEDAL EMOJI", "Rank 1", "Positive", OK),
            ("THE SAME HEADING WITHOUT IT", "No rank", "Neutral", WARN),
    ]):
        yy = cy + i * (ch + gap)
        surf = S if i == 0 else S2
        bx = a.card(pad, yy, 1080 - pad * 2, ch, fill=surf)
        a.text(f"c{i}-label", (pad + 40, yy + 32), label, font("SemiBold", 30),
               T3, surface=surf, tracking=0.11, box=bx)
        a.text(f"c{i}-a", (pad + 40, yy + ch - 40), l_a, font("ExtraBold", 58),
               col, surface=surf, anchor="ls", box=bx)
        a.text(f"c{i}-b", (1080 - pad - 40, yy + ch - 46), l_b,
               font("Medium", 40), T2, surface=surf, anchor="rs", box=bx)
    _th_close(a)
    return a


def th_near_miss():
    a = _th_open("threads-3-the-near-miss-1080x1350.png",
                 (1080 * 0.5, -1350 * 0.08, 1080 * 1.0, AC, 0.16),
                 "CHICAGO AND BOSTON, 24 JULY 2026")
    pad = TH_PAD

    l1 = ["An invented firm", "is the easy case."]
    f = _headline_font(l1, "ExtraBold", 88, 1080 - pad * 2)
    y = a.block("headline", (pad, TH_TOP), l1, f, T, leading=1.06)
    y = a.block("headline", (pad, y + 6), ["The near miss", "is not."],
                f, ACT, leading=1.06)

    cy = int(y) + 52
    ch = 1350 - pad - 92 - cy
    bx = a.card(pad, cy, 1080 - pad * 2, ch, fill=S)
    a.text("card-label", (pad + 40, cy + 34), "HARDER TO CATCH THAN A FICTION",
           font("SemiBold", 30), T3, surface=S, tracking=0.11, box=bx)
    rows = ["Your name merged with another",
            "A trading name you dropped",
            "A wrong legal suffix"]
    ry = cy + 110
    rh = (ch - 150) / len(rows)
    for i, r in enumerate(rows):
        my = ry + i * rh + rh * 0.5
        a.bar(pad + 40, my - 5, 10, 10, fill=ACS, radius=5)
        a.text("row", (pad + 74, my), r, font("Medium", 42), T, surface=S,
               anchor="lm", box=bx)
        if i < len(rows) - 1:
            a.d.line([(pad + 40, ry + (i + 1) * rh),
                      (1080 - pad - 40, ry + (i + 1) * rh)], fill=hexs(BD), width=2)
            a.rect("rule", pad + 40, ry + (i + 1) * rh, 1080 - pad - 40,
                   ry + (i + 1) * rh + 2)
    _th_close(a)
    return a


def th_null():
    a = _th_open("threads-4-an-empty-field-1080x1350.png",
                 (1080 * 0.9, 1350 * 0.5, 1080 * 0.8, AC, 0.15),
                 "HOW OUR SCORER REPORTS A RANK")
    pad = TH_PAD

    l1 = ["A number only", "appears when the", "engine claimed one."]
    f = _headline_font(l1, "ExtraBold", 82, 1080 - pad * 2)
    y = a.block("headline", (pad, TH_TOP - 30), l1, f, T, leading=1.06)
    y = a.block("headline", (pad, y + 6), ["Otherwise the field", "is empty."],
                f, ACT, leading=1.06)

    cy = int(y) + 48
    ch = 1350 - pad - 92 - cy
    bx = a.card(pad, cy, 1080 - pad * 2, ch, fill=S)
    a.text("card-label", (pad + 40, cy + 32), "WHAT COUNTS AS A CLAIMED RANK",
           font("SemiBold", 30), T3, surface=S, tracking=0.11, box=bx)
    rows = [("A real numbered list", True),
            ("A list with ordering words", True),
            ("A superlative tied to the name", True),
            ("A brand seen partway down", False)]
    ry = cy + 104
    rh = (ch - 144) / len(rows)
    for i, (r, good) in enumerate(rows):
        my = ry + i * rh + rh * 0.5
        a.bar(pad + 40, my - 5, 10, 10, fill=ACS if good else BD2, radius=5)
        a.text("row", (pad + 74, my), r, font("Medium", 38),
               T if good else T3, surface=S, anchor="lm", box=bx)
        a.text("row-out", (1080 - pad - 40, my), "rank" if good else "null",
               font("SemiBold", 36), ACT if good else T3, surface=S, anchor="rm",
               box=bx)
        if i < len(rows) - 1:
            a.d.line([(pad + 40, ry + (i + 1) * rh),
                      (1080 - pad - 40, ry + (i + 1) * rh)], fill=hexs(BD), width=2)
            a.rect("rule", pad + 40, ry + (i + 1) * rh, 1080 - pad - 40,
                   ry + (i + 1) * rh + 2)
    _th_close(a)
    return a


# ------------------------------------------------------------------ main ----
BUILDERS = [x_thread_a, x_thread_b, x_standalone_1, x_standalone_2,
            th_converge, th_emoji, th_near_miss, th_null]


def main():
    os.makedirs(X_OUT, exist_ok=True)
    os.makedirs(TH_OUT, exist_ok=True)
    failures = []
    all_strings = {}
    print(f"{'asset':<52} {'size':>10}  {'KB':>7}  lockup clear  legibility")
    print("-" * 104)
    for b in BUILDERS:
        a = b()
        clear, frac, problems = a.check_lockup_clearspace()
        bad = a.check_legibility()
        over = a.check_containment() + a.check_collisions()
        p = a.save()
        im = Image.open(p)
        assert (im.width, im.height) == (a.w, a.h)
        all_strings[a.name] = a.strings
        status = "OK" if not problems else "INTRUSION"
        leg = "OK" if not bad else f"{len(bad)} under floor"
        if over:
            leg += f" / {len(over)} overflow"
        print(f"{a.name:<52} {im.width}x{im.height:<4} {os.path.getsize(p)/1024:7.1f}  "
              f"{clear:5.1f}px {status:<10} {leg}")
        for pr in problems:
            failures.append(f"{a.name}: lockup clear space: {pr}")
        for tag, size, eff in bad:
            failures.append(f"{a.name}: {tag} {size}px renders at {eff:.1f}px in feed")
        for o in over:
            failures.append(f"{a.name}: overflow: {o}")

    # ---- contrast, measured per actual pairing ----
    # Recomputed from a fresh pass so the table covers every asset and is
    # deduplicated by (foreground, surface). The surface recorded is the one
    # the glyph actually sits on, card or canvas, not an assumed page colour.
    print("\ncontrast, sRGB relative luminance, foreground against the surface "
          "it really sits on")
    seen, rows = set(), []
    for b in BUILDERS:
        a = b()
        for fg, bgc, r, need, ok, size in a.contrast_rows():
            key = (fg, bgc)
            if key in seen:
                continue
            seen.add(key)
            rows.append((fg, bgc, r, need, ok, size))
    for fg, bgc, r, need, ok, size in sorted(rows, key=lambda t: t[2]):
        kind = "large" if size >= 37 else "body"
        print(f"  {fg} on {bgc}   {r:6.2f}:1   needs {need:.1f} ({kind})   "
              f"{'PASS' if ok else 'FAIL'}")
        if not ok:
            failures.append(f"contrast {fg} on {bgc} is {r:.2f}:1, needs {need}")
    print(f"  lowest measured ratio: {min(r for _, _, r, _, _, _ in rows):.2f}:1")

    # ---- legibility budget, stated rather than assumed ----
    print("\nlegibility at the size the image is actually viewed")
    print(f"  X 1600x900 in-timeline reference 500 CSS px, scale {X_SCALE:.3f}")
    print(f"  Threads 1080x1350 in-feed reference 500 CSS px, scale {TH_SCALE:.3f}")
    print(f"  floor {EFFECTIVE_FLOOR:.0f}px effective")
    for b in BUILDERS:
        a = b()
        sizes = sorted({s for _, s, _, _ in a.type_items})
        eff = [f"{s}->{s*a.scale:.1f}" for s in sizes]
        print(f"  {a.name[:46]:<46} {', '.join(eff)}")

    # Every string ffmpeg-style, written out so the compliance scanner reads
    # the DRAWN BYTES rather than this source file or the POSTS.md prose.
    dump = os.path.join(HERE, "drawn-strings.txt")
    with open(dump, "w", encoding="utf-8") as fh:
        for name, ss in all_strings.items():
            for s in ss:
                fh.write(f"{name}\t{s}\n")
    print(f"\nwrote {dump} ({sum(len(v) for v in all_strings.values())} drawn strings)")

    if failures:
        print("\nFAILURES")
        for f in failures:
            print("  " + f)
        sys.exit(1)
    print("\nall checks passed")


if __name__ == "__main__":
    main()
