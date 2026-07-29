"""
Shared rendering primitives for the BrandGEO data-card templates.

Everything is drawn with Pillow at a supersampled scale and downsampled with
LANCZOS, the same technique proven in
docs/growth/brand-identity-2026-07-29/v3/build/render_v3.py. There is no
matplotlib, no cairo and no ImageMagick on this machine, so shapes and text are
composed directly.

Nothing in this module reads a database. Generators consume JSON extracted by
the SQL recorded in README.md, so a render can never trigger a collection run.
"""

import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
LOGO_DIR = os.path.join(REPO, "docs", "growth", "brand-identity-2026-07-29", "v3", "png")

# --------------------------------------------------------------------------
# Brand tokens. Values verified against brandgeo/web/index.html :root and
# docs/growth/channel-specs-2026-07-29.md on 2026-07-29.
# --------------------------------------------------------------------------

BG = "#0a0b0e"       # canvas, the LIVE value in :root
SURFACE = "#101116"  # card surface, the surface every palette was validated on
SURFACE_2 = "#16171e"
BORDER = "#23242b"
BORDER_2 = "#32333c"

TEXT = "#e8e9ed"     # 16.22:1
TEXT_2 = "#9ba1ac"   # 7.58:1
TEXT_3 = "#7d838f"   # 5.17:1

AC = "#8b5cf6"        # fill only, 4.65:1
AC_STRONG = "#7c3aed"  # CTA fill, 5.7:1
AC_TEXT = "#a78bfa"   # accent WORDS, 7.23:1

OK = "#34d399"
PART = "#fb923c"
BAD = "#f87171"
INFO = "#c4b5fd"
WARN = "#fbbf24"

# --------------------------------------------------------------------------
# Engine series palette.
#
# NOT the palette in brandgeo-dashboard/src/lib/planConfig.ts. That one was
# measured against the project's own separation floor and the live set clears it
# only marginally (worst all-pairs CVD 6.1, which is inside the 6-8 band that is
# legal ONLY with secondary encoding), while the retired-engine entries contain
# two outright failures. See README.md "Colour" for the full computed table.
#
# These five were derived by constrained search: each slot is confined to its
# own engine's hue family so the colour still reads as that engine, then
# optimised for worst-case separation. Verified with the dataviz validator:
#   all-pairs  CVD 12.3 (deutan)   normal-vision 16.1
#   adjacent   CVD 12.7 (deutan)   normal-vision 30.5
# against surface #101116 in dark mode. Target is CVD 8, hard floor is
# normal-vision 15, so both clear with margin.
# --------------------------------------------------------------------------

ENGINE_COLOR = {
    "chatgpt":    "#2aac00",
    "gemini":     "#0098ff",
    "claude":     "#b23900",
    "perplexity": "#00a7a0",
    "google_ai":  "#b229ad",
    # Retired 2026-07-16. Deliberately NOT a categorical slot: a retired engine
    # is context, not identity, so it takes the de-emphasis grey. This also
    # keeps the live set at five, which is what makes the separation above
    # achievable at all.
    "meta":       TEXT_3,
}

ENGINE_LABEL = {
    "chatgpt": "ChatGPT",
    "gemini": "Gemini",
    "claude": "Claude",
    "perplexity": "Perplexity",
    "google_ai": "Google AI Mode",
    "meta": "Meta AI (retired)",
}

ENGINE_ORDER = ["chatgpt", "gemini", "claude", "perplexity", "google_ai", "meta"]

# The brand violet must never be used as a series colour beside these. Measured:
# #8b5cf6 against Gemini #0098ff is CVD deltaE 6.0, a hard FAIL. Violet stays
# brand chrome (mark, CTA, accent words) and single-series fills only.

# --------------------------------------------------------------------------
# Output sizes, from the deduplicated render matrix in
# docs/growth/channel-specs-2026-07-29.md
# --------------------------------------------------------------------------

SIZES = {
    "og":       (1200, 630),    # R3: blog OG card, FB link, LinkedIn unfurl, X card
    "square":   (1080, 1080),   # R5: LinkedIn / X / IG square
    "portrait": (1080, 1350),   # R2: IG feed and carousel, LinkedIn portrait
    "threads":  (1440, 1800),   # R2a: Threads and Facebook feed. Threads caps at 1440 wide
    "story":    (1080, 1920),   # R1: Reels, TikTok, Shorts, FB Reels
    "wide":     (1600, 900),    # R6: X in-feed image, blog article hero
}

# Meta's safe area on a 1080x1920 master: top 14 percent, bottom 35 percent.
# Only applied to the story size.
STORY_SAFE_TOP = 0.14
STORY_SAFE_BOTTOM = 0.35


# --------------------------------------------------------------------------
# Typeface
#
# Inter is the brand typeface and is NOT installed on this machine. Checked
# 2026-07-29: 473 files in C:\Windows\Fonts, zero match "inter"; no user font
# directory; the only Inter in the repo is .woff2 inside brandgeo-next build
# output, which Pillow cannot load (FreeType reads ttf/otf, not woff2).
#
# Segoe UI is the substitute: a humanist sans with similar proportions, present
# on every Windows machine. Any render made here is therefore NOT typographically
# final. To render in real Inter, drop Inter .ttf files into ./fonts/ and this
# module picks them up automatically, no code change.
# --------------------------------------------------------------------------

_FONT_DIRS = [os.path.join(HERE, "fonts"), r"C:\Windows\Fonts"]
_FONT_CANDIDATES = {
    "regular":  ["Inter-Regular.ttf", "InterVariable.ttf", "segoeui.ttf", "arial.ttf"],
    "medium":   ["Inter-Medium.ttf", "InterVariable.ttf", "segoeui.ttf", "arial.ttf"],
    "semibold": ["Inter-SemiBold.ttf", "seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"],
    "bold":     ["Inter-Bold.ttf", "segoeuib.ttf", "arialbd.ttf"],
}
_font_cache = {}


def font_path(weight):
    for name in _FONT_CANDIDATES[weight]:
        for d in _FONT_DIRS:
            p = os.path.join(d, name)
            if os.path.exists(p):
                return p
    raise RuntimeError(f"no font found for weight {weight}")


def font(weight, size):
    key = (weight, int(size))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(font_path(weight), int(size))
    return _font_cache[key]


def font_report():
    """What actually got loaded. Printed by every generator so a sample PNG is
    never silently mistaken for an Inter render."""
    out = {}
    for w in _FONT_CANDIDATES:
        p = font_path(w)
        out[w] = os.path.basename(p)
    out["is_inter"] = all("Inter" in v for k, v in out.items() if k != "is_inter")
    return out


# --------------------------------------------------------------------------
# Colour helpers
# --------------------------------------------------------------------------

def hexc(h, alpha=None):
    h = h.lstrip("#")
    rgb = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    return rgb + (alpha,) if alpha is not None else rgb


def mix(a, b, t):
    """Linear blend in sRGB. Used only for hairlines and inert tracks, never for
    a data colour, because a blended data colour would not be a validated step."""
    ca, cb = hexc(a), hexc(b)
    return tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))


def _lum(rgb):
    o = []
    for c in rgb:
        c /= 255.0
        o.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2]


def contrast(a, b):
    la = _lum(a if isinstance(a, tuple) else hexc(a))
    lb = _lum(b if isinstance(b, tuple) else hexc(b))
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# --------------------------------------------------------------------------
# Supersampled canvas
# --------------------------------------------------------------------------

class Canvas:
    """Draws at SS times the target size, then downsamples with LANCZOS.

    SS is chosen so the working bitmap stays under roughly 40 megapixels, which
    keeps a 1080x1920 story render fast while still giving small text clean
    edges.
    """

    def __init__(self, w, h, bg=BG):
        self.w, self.h = w, h
        longest = max(w, h)
        self.ss = 4 if longest <= 1200 else (3 if longest <= 2000 else 2)
        self.im = Image.new("RGB", (w * self.ss, h * self.ss), hexc(bg))
        self.d = ImageDraw.Draw(self.im, "RGBA")

    # geometry passthroughs, all in target-space units
    def _s(self, v):
        return v * self.ss

    def rect(self, box, fill=None, radius=0, outline=None, width=1):
        x0, y0, x1, y1 = [self._s(v) for v in box]
        f = hexc(fill) if isinstance(fill, str) else fill
        o = hexc(outline) if isinstance(outline, str) else outline
        if radius:
            self.d.rounded_rectangle([x0, y0, x1, y1], radius=self._s(radius),
                                     fill=f, outline=o, width=max(1, int(self._s(width))))
        else:
            self.d.rectangle([x0, y0, x1, y1], fill=f, outline=o,
                             width=max(1, int(self._s(width))))

    def circle(self, cx, cy, r, fill=None, outline=None, width=1):
        cx, cy, r = self._s(cx), self._s(cy), self._s(r)
        f = hexc(fill) if isinstance(fill, str) else fill
        o = hexc(outline) if isinstance(outline, str) else outline
        self.d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=f, outline=o,
                       width=max(1, int(self._s(width))))

    def line(self, pts, fill, width=1):
        f = hexc(fill) if isinstance(fill, str) else fill
        self.d.line([(self._s(x), self._s(y)) for x, y in pts], fill=f,
                    width=max(1, int(self._s(width))), joint="curve")

    def text(self, xy, s, weight="regular", size=16, fill=TEXT, anchor="la",
             spacing=0):
        f = font(weight, self._s(size))
        col = hexc(fill) if isinstance(fill, str) else fill
        x, y = self._s(xy[0]), self._s(xy[1])
        if spacing:
            # manual letter-spacing for eyebrow/label text
            gap = self._s(spacing)
            total = sum(self.d.textlength(ch, font=f) + gap for ch in s) - gap
            if anchor[0] == "r":
                x -= total
            elif anchor[0] == "m":
                x -= total / 2
            for ch in s:
                self.d.text((x, y), ch, font=f, fill=col, anchor="l" + anchor[1])
                x += self.d.textlength(ch, font=f) + gap
            return total / self.ss
        self.d.text((x, y), s, font=f, fill=col, anchor=anchor)
        return self.d.textlength(s, font=f) / self.ss

    def measure(self, s, weight="regular", size=16, spacing=0):
        f = font(weight, self._s(size))
        if spacing:
            gap = self._s(spacing)
            return (sum(self.d.textlength(c, font=f) + gap for c in s) - gap) / self.ss
        return self.d.textlength(s, font=f) / self.ss

    def paste_image(self, im, box, keep_ratio=True):
        """box is (x, y, w, h) in target units."""
        x, y, w, h = [self._s(v) for v in box]
        w, h = int(round(w)), int(round(h))
        if keep_ratio:
            r = min(w / im.width, h / im.height)
            w, h = int(round(im.width * r)), int(round(im.height * r))
        thumb = im.resize((max(1, w), max(1, h)), Image.LANCZOS)
        self.im.paste(thumb, (int(round(x)), int(round(y))),
                      thumb if thumb.mode == "RGBA" else None)

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        out = self.im.resize((self.w, self.h), Image.LANCZOS)
        out.save(path, "PNG", optimize=True)
        return path


# --------------------------------------------------------------------------
# Shared chrome
# --------------------------------------------------------------------------

def load_mark(px=512):
    """Bare mark on transparent, per the brief."""
    p = os.path.join(LOGO_DIR, f"mark-{px}.png")
    if not os.path.exists(p):
        p = os.path.join(LOGO_DIR, "mark-512.png")
    return Image.open(p).convert("RGBA")


def draw_footer(c, m, y, brandline="getbrandgeo.com", note=None, mark_h=None):
    """Mark, wordmark-ish url, and an optional provenance note on the right.

    The note is where the honesty lives: every card states what it measured and
    when, so a reader can tell a measurement from a claim.
    """
    mh = mark_h or m.s(22)
    try:
        mk = load_mark(512)
        c.paste_image(mk, (m.pad, y - mh * 0.5, mh, mh))
    except Exception:
        pass
    c.text((m.pad + mh + m.s(10), y), brandline, "semibold", m.s(15), TEXT_2, "lm")
    if note:
        c.text((m.w - m.pad, y), note, "regular", m.s(13), TEXT_3, "rm")


class Metrics:
    """Size-aware spacing so one layout works across the render matrix."""

    def __init__(self, w, h, preset):
        self.w, self.h, self.preset = w, h, preset
        self.base = w / 1080.0
        self.pad = self.s(64)
        if preset == "og":
            self.pad = self.s(56)
        self.safe_top = h * STORY_SAFE_TOP if preset == "story" else self.pad
        self.safe_bottom = h * (1 - STORY_SAFE_BOTTOM) if preset == "story" else h - self.pad

    def s(self, v):
        return v * self.base


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
    return path


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
