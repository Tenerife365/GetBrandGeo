"""
Facebook static assets, CAMPAIGN-2026-07-30.

Four feed images at 1440x1800 and four link-preview cards at 1200x630.

Foundation is `docs/growth/grok-launch/images/_build/render_launch_images.py`:
Pillow only, 8x supersampled shape masks downsampled with Lanczos, real Inter
loaded from disk. No matplotlib, no cairosvg, no ImageMagick, none of which are
installed here.

Everything drawn traces to a run NOTES file under
`docs/growth/reel-campaign-ab/run-*/facebook/` and, through it, to a published
page on getbrandgeo.com. No claim on any image is new. Per-image sourcing sits
in the FINDINGS table below.

Two things this script does that the foundation did not:

1. **Every drawn element declares its rect.** The lockup reserve (the lockup box
   grown by the mark's own height on all four sides) is then asserted against
   every other rect and against the canvas edge. Clear space is proven, not
   eyeballed.
2. **Contrast is measured twice, the second time against real pixels.** The
   default report checks each colour against the token surface it sits on
   (`#101116` for card text, not `#0a0b0e`). `--verify-bg` then re-renders every
   sheet with the type suppressed, samples the LIGHTEST background pixel inside
   each string's own ink bbox out of that text-free control, and recomputes the
   ratio against it. That second pass exists because the violet vignette
   measurably lightens the field under the eyebrow and the headline, so the token
   table overstates those ratios.

Run: python render_facebook_static.py              (render and token-surface report)
     python render_facebook_static.py --verify-bg  (contrast against real pixels)
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FB = os.path.abspath(os.path.join(HERE, ".."))
FEED = os.path.join(FB, "feed")
LINK = os.path.join(FB, "link")
SHARED = os.path.abspath(os.path.join(FB, "..", "_shared"))
FONTS = os.path.join(SHARED, "fonts")
LOCKUP = os.path.join(SHARED, "logo", "brandgeo-lockup-dark-transparent-w512.png")

SS = 8

# ---------------------------------------------------------------- palette ---
# docs/growth/channel-specs-2026-07-29.md, via _shared/BRIEF.md section 5.
BG = "#0a0b0e"      # canvas
S = "#101116"       # card surface
S2 = "#16171e"      # raised surface
BD = "#23242b"      # hairline border
BD2 = "#32333c"     # stronger border
AC = "#8b5cf6"      # primary violet. FILL ONLY, never a text colour.
ACS = "#7c3aed"     # CTA fill
ACT = "#a78bfa"     # accent WORDS
T = "#e8e9ed"       # primary text
T2 = "#9ba1ac"      # secondary text
T3 = "#7d838f"      # muted text
OK = "#34d399"
PARTIAL = "#fb923c"
BAD = "#f87171"
INFO = "#c4b5fd"


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


# Every (colour, surface, role) pair the renderer actually draws. Filled by
# `text()` at draw time so the report cannot drift from the artwork.
MEASURED = {}

# Every string handed to text(), in draw order. scan.py reads THIS, not the
# source, so a string that is edited but never drawn cannot pass the sweep.
DRAWN = []

# Every sheet saved, keyed by output path, so the background under each string
# can be sampled from a text-free re-render rather than assumed flat.
SHEETS = {}
NO_TEXT = False


def note_contrast(fg, bg, role, large):
    MEASURED.setdefault((fg, bg, role, large), contrast(fg, bg))


# ------------------------------------------------------------ shape masks ---
def mask_rrect(w, h, radius):
    m = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [0, 0, w * SS - 1, h * SS - 1], radius=radius * SS, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def paste_flat(base, mask, xy, colour):
    layer = Image.new("RGB", mask.size, hexs(colour) if isinstance(colour, str) else colour)
    base.paste(layer, xy, mask)


def vignette(base, cx, cy, radius, colour=AC, strength=0.15):
    """Soft off-canvas bloom.

    It DOES pass under the eyebrow and the headline on every sheet. Measured with
    `--verify-bg`, the field under the eyebrow reaches `#1e1831`, which takes
    `#a78bfa` from the token table's 7.23:1 down to 6.27:1. Still comfortably over
    4.5:1, but that is a measurement, not the assumption an earlier version of
    this docstring made. Strength is kept low so the flat fields stay flat."""
    w, h = base.size
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - cx) / radius) ** 2 + ((yy - cy) / radius) ** 2)
    a = np.clip(1.0 - r, 0, 1) ** 2 * strength
    c = np.array(hexs(colour), dtype=np.float32)
    b = np.asarray(base).astype(np.float32)
    base.paste(Image.fromarray(np.clip(b + a[..., None] * c, 0, 255).astype(np.uint8)), (0, 0))


# ------------------------------------------------------------------ type ----
_font_cache = {}


def font(weight, size):
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONTS, f"Inter-{weight}.ttf"), size)
    return _font_cache[key]


def tracked_width(s, f, tracking):
    step = tracking * f.size
    return sum(f.getlength(ch) + step for ch in s) - step


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


def fit(lines, weight, start, max_w, floor=20):
    size = start
    while size > floor and max(font(weight, size).getlength(s) for s in lines) > max_w:
        size -= 1
    return font(weight, size)


def fit_wrap(s, weight, start, max_w, max_lines, floor=20):
    """Largest size at which `s` wraps to at most `max_lines` inside `max_w`."""
    size = start
    while size > floor:
        f = font(weight, size)
        if len(wrap(s, f, max_w)) <= max_lines:
            return f, wrap(s, f, max_w)
        size -= 2
    f = font(weight, floor)
    return f, wrap(s, f, max_w)


class Sheet:
    """A canvas that records the rect of everything drawn on it, so clear space
    around the lockup can be asserted rather than assumed."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new("RGB", (w, h), hexs(BG))
        self.d = ImageDraw.Draw(self.im)
        self.rects = []          # (x0, y0, x1, y1, label)
        self.text_specs = []     # (ink bbox, fill, label, is_large)
        self.lockup_rect = None
        self.mark_h = None

    # ---- primitives
    def text(self, xy, s, f, fill, surface=BG, anchor="la", tracking=0.0, label="text"):
        note_contrast(fill, surface, label, f.size >= 30)
        DRAWN.append(s)
        _fill = fill
        x, y = xy
        # Rects are INK bboxes from textbbox, not font metric boxes. Metric boxes
        # of consecutive lines legitimately overlap at tight leading, which made
        # the overlap assertion fire on correct typography until this was fixed.
        boxes = []
        if tracking:
            step = tracking * f.size
            total = tracked_width(s, f, tracking)
            if anchor[0] == "m":
                x -= total / 2.0
            elif anchor[0] == "r":
                x -= total
            va = anchor[1]
            cx = x
            for ch in s:
                if not NO_TEXT:
                    self.d.text((cx, y), ch, font=f, fill=hexs(fill), anchor="l" + va)
                if ch.strip():
                    boxes.append(self.d.textbbox((cx, y), ch, font=f, anchor="l" + va))
                cx += f.getlength(ch) + step
        else:
            if not NO_TEXT:
                self.d.text((x, y), s, font=f, fill=hexs(fill), anchor=anchor)
            boxes.append(self.d.textbbox((x, y), s, font=f, anchor=anchor))
        if not boxes:
            boxes = [(x, y, x, y)]
        bb = (min(b[0] for b in boxes), min(b[1] for b in boxes),
              max(b[2] for b in boxes), max(b[3] for b in boxes))
        self.rects.append((bb[0], bb[1], bb[2], bb[3], label))
        self.text_specs.append((bb, _fill, label, f.size >= 30))
        return bb[3]

    def block(self, xy, lines, f, fill, surface=BG, leading=1.14, tracking=0.0, label="text"):
        x, y = xy
        lh = f.size * leading
        for i, ln in enumerate(lines):
            self.text((x, y + i * lh), ln, f, fill, surface=surface,
                      tracking=tracking, label=label)
        return y + (len(lines) - 1) * lh + f.size * 1.18

    def bar(self, xy, w, h, colour=ACS, radius=None, label="rule"):
        r = radius if radius is not None else h // 2
        paste_flat(self.im, mask_rrect(w, h, r), (int(xy[0]), int(xy[1])), colour)
        self.rects.append((xy[0], xy[1], xy[0] + w, xy[1] + h, label))

    def card(self, xy, w, h, fill=S, radius=28, border=BD):
        x, y = int(xy[0]), int(xy[1])
        paste_flat(self.im, mask_rrect(w, h, radius), (x, y), fill)
        edge = Image.new("L", (w, h), 0)
        ImageDraw.Draw(edge).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius,
                                               outline=255, width=1)
        paste_flat(self.im, edge, (x, y), border)
        self.rects.append((x, y, x + w, y + h, "card"))
        return x, y

    def rule(self, x0, x1, y, colour=BD):
        self.d.line([(x0, y), (x1, y)], fill=hexs(colour), width=1)

    # ---- lockup
    def lockup(self, x, y, height, anchor="lb"):
        """The `_shared/logo` lockup, downscaled only. Records its own rect and
        the mark's height inside it, which is what the clear-space rule is
        measured in."""
        im = Image.open(LOCKUP).convert("RGBA")
        src_w, src_h = im.size
        assert height <= src_h, f"lockup upscaled: {height} > native {src_h}"
        # Mark occupies the upper ink run of the stacked lockup. Measured from
        # the alpha channel every run rather than hardcoded.
        rows = (np.asarray(im.getchannel("A")) > 10).sum(axis=1)
        runs, start = [], None
        for i, v in enumerate(rows):
            if v > 0 and start is None:
                start = i
            if v == 0 and start is not None:
                runs.append((start, i - 1))
                start = None
        if start is not None:
            runs.append((start, len(rows) - 1))
        assert len(runs) == 2, f"expected mark+wordmark ink runs, got {runs}"
        mark_frac = (runs[0][1] - runs[0][0] + 1) / src_h

        w = int(round(height * src_w / src_h))
        im = im.resize((w, height), Image.LANCZOS)
        left = x if anchor[0] == "l" else x - w
        top = y if anchor[1] == "t" else y - height
        self.im.paste(im, (int(left), int(top)), im)
        self.lockup_rect = (left, top, left + w, top + height)
        self.mark_h = height * mark_frac
        return self.lockup_rect

    def assert_no_text_overlap(self):
        """No two drawn strings may share a pixel. The first build of this file
        shipped a card whose rows ran into each other because the row height was
        derived from the space available rather than from the content, and the
        clear-space check could not see it. Backgrounds (card, rule) are excluded;
        they are meant to sit under type."""
        ink = [r for r in self.rects if r[4] not in ("card", "rule")]
        for i in range(len(ink)):
            a0, b0, a1, b1, la = ink[i]
            for j in range(i + 1, len(ink)):
                c0, d0, c1, d1, lb = ink[j]
                if a1 <= c0 or c1 <= a0 or b1 <= d0 or d1 <= b0:
                    continue
                raise AssertionError(
                    f"text overlap: '{la}' ({a0:.0f},{b0:.0f},{a1:.0f},{b1:.0f}) "
                    f"and '{lb}' ({c0:.0f},{d0:.0f},{c1:.0f},{d1:.0f})")

    def assert_inside_canvas(self):
        for a0, b0, a1, b1, label in self.rects:
            assert a0 >= 0 and b0 >= 0 and a1 <= self.w and b1 <= self.h, (
                f"'{label}' at ({a0:.0f},{b0:.0f},{a1:.0f},{b1:.0f}) leaves the "
                f"{self.w}x{self.h} canvas")

    def assert_clear_space(self):
        """Clear space of at least the mark's own height on all four sides."""
        assert self.lockup_rect is not None, "no lockup drawn"
        x0, y0, x1, y1 = self.lockup_rect
        c = self.mark_h
        rx0, ry0, rx1, ry1 = x0 - c, y0 - c, x1 + c, y1 + c
        assert rx0 >= 0 and ry0 >= 0 and rx1 <= self.w and ry1 <= self.h, (
            f"lockup clear space {c:.1f}px runs off canvas: "
            f"reserve=({rx0:.0f},{ry0:.0f},{rx1:.0f},{ry1:.0f}) canvas={self.w}x{self.h}")
        for a0, b0, a1, b1, label in self.rects:
            if a1 <= rx0 or a0 >= rx1 or b1 <= ry0 or b0 >= ry1:
                continue
            raise AssertionError(
                f"'{label}' at ({a0:.0f},{b0:.0f},{a1:.0f},{b1:.0f}) intrudes on the "
                f"lockup clear space ({rx0:.0f},{ry0:.0f},{rx1:.0f},{ry1:.0f})")
        return c

    def save(self, path):
        self.assert_inside_canvas()
        self.assert_no_text_overlap()
        self.assert_clear_space()
        SHEETS[path] = self
        if NO_TEXT:
            return
        self.im.save(path, "PNG", optimize=True)
        WRITTEN.append(path)


WRITTEN = []


# ================================================================ copy ======
# Every string below is traced in FINDINGS. Nothing here is written fresh.

FINDINGS = {
    "fb-feed-01-description": dict(
        source="docs/growth/reel-campaign-ab/run-20260730-0513/facebook/NOTES.md",
        page="(no research page; product behaviour, not a measurement)",
        note="Carries no number and no engine count by construction."),
    "fb-feed-02-language-split": dict(
        source="docs/growth/reel-campaign-ab/run-20260730-0613/facebook/NOTES.md",
        page="brandgeo/web/ai-visibility-for-madrid.html, collected 2026-07-10",
        note="No engine count stated in either direction: one engine failed to "
             "collect on every Madrid prompt that run."),
    "fb-feed-03-placement": dict(
        source="docs/growth/reel-campaign-ab/run-20260730-0216/facebook/NOTES.md",
        page="brandgeo/web/ai-visibility-for-chicago.html, collected 2026-07-24",
        note="Five engines is that run's denominator, carried with its date. The "
             "page's program-wide superlative is NOT used; it is false."),
    "fb-feed-04-rank-vs-answer": dict(
        source="docs/growth/reel-campaign-ab/run-20260730-0113/facebook/NOTES.md",
        page="brandgeo/web/bg-004.html, published 2026-07-02",
        note="No engine count: that audit's lineup included Copilot and is not "
             "today's. Majority-not-every qualifier carried on the card."),
}


# ============================================================ feed images ===
FEED_W, FEED_H = 1440, 1800
FEED_PAD = 120
FEED_COL = FEED_W - FEED_PAD * 2
LOCK_H_FEED = 150


def feed_shell(eyebrow, headline, deck, vig=(0.78, 0.06)):
    sh = Sheet(FEED_W, FEED_H)
    vignette(sh.im, FEED_W * vig[0], FEED_H * vig[1], FEED_W * 0.85, AC, 0.15)

    y = FEED_PAD
    sh.text((FEED_PAD, y), eyebrow, font("SemiBold", 28), ACT, tracking=0.17,
            label="eyebrow")

    # Three lines maximum. A four-line headline at this size pushed the evidence
    # card off the bottom of the canvas, and a feed image whose finding is below
    # the fold is not a feed image.
    f_h, lines = fit_wrap(headline, "Bold", 96, FEED_COL, 3, floor=54)
    y = sh.block((FEED_PAD, y + 62), lines, f_h, T, leading=1.10, label="headline")

    y += 20
    sh.bar((FEED_PAD, y), 168, 9, ACS)
    y += 9 + 36

    f_d = font("Regular", 34)
    y = sh.block((FEED_PAD, y), wrap(deck, f_d, FEED_COL), f_d, T2,
                 leading=1.44, label="deck")
    return sh, y


def feed_footer(sh):
    sh.lockup(FEED_PAD, FEED_H - FEED_PAD, LOCK_H_FEED, anchor="lb")
    sh.text((FEED_W - FEED_PAD, FEED_H - FEED_PAD - LOCK_H_FEED / 2),
            "getbrandgeo.com", font("Medium", 28), T3, anchor="rm", label="domain")


def card_top_limit(sh):
    """Highest y a card may extend to before it eats the lockup clear space."""
    return FEED_H - FEED_PAD - LOCK_H_FEED - LOCK_H_FEED * 0.6975 - 8

def place_card(sh, deck_end, card_h):
    """Cards share a bottom edge across all four feed images: each sits directly
    on top of the lockup clear space. Height comes from the content, never from
    the space available, which is what collided on the first build of this file."""
    top = card_top_limit(sh) - card_h
    assert top >= deck_end + 44, (
        f"card of {card_h:.0f}px does not fit: top would be {top:.0f}, "
        f"deck ends at {deck_end:.0f}")
    return sh.card((FEED_PAD, top), FEED_COL, int(card_h))


CARD_PAD = 52
CARD_HEAD = 34 + 46          # the card's own eyebrow line, plus the gap under it
NOTE_LEAD = 26 * 1.42


def note_height(text_, width):
    return len(wrap(text_, font("Regular", 26), width)) * NOTE_LEAD


def card_note(sh, x0, y, text_, width):
    sh.rule(x0 + CARD_PAD, x0 + FEED_COL - CARD_PAD, y - 32, BD2)
    f_n = font("Regular", 26)
    sh.block((x0 + CARD_PAD, y), wrap(text_, f_n, width), f_n, T3, surface=S,
             leading=1.42, label="card note")


def feed_01_description():
    """Misdescription. Run 20260730-0513. No number of any kind on this one."""
    sh, y = feed_shell(
        "WHAT THE ANSWER SAYS ABOUT YOU",
        "An AI can name your company and still describe it wrong.",
        "The sentence beside your name is assembled by the engine out of whatever "
        "it can find and match to you. You did not write it. You do not get a copy "
        "of it. It reaches your buyer anyway.",
        vig=(0.82, 0.05))

    rows = [("Whether you were named", T, False),
            ("Where you were placed", T, False),
            ("The wording used about you", ACT, True)]
    rh = 140
    card_h = CARD_PAD * 2 + CARD_HEAD + rh * len(rows)
    x0, y0 = place_card(sh, y, card_h)

    sh.text((x0 + CARD_PAD, y0 + CARD_PAD), "RECORDED PER ENGINE, PER QUESTION",
            font("SemiBold", 24), T3, surface=S, tracking=0.15, label="card head")
    for i, (label, col, emph) in enumerate(rows):
        ry = y0 + CARD_PAD + CARD_HEAD + rh * i
        cyc = ry + rh * 0.5
        sh.bar((x0 + CARD_PAD, int(cyc - 24)), 7, 48, ACS if emph else BD2, radius=3)
        sh.text((x0 + CARD_PAD + 32, cyc), label,
                font("SemiBold" if emph else "Medium", 44), col, surface=S,
                anchor="lm", label="card row")
        if i < len(rows) - 1:
            sh.rule(x0 + CARD_PAD, x0 + FEED_COL - CARD_PAD, ry + rh)

    feed_footer(sh)
    sh.save(os.path.join(FEED, "fb-feed-01-description-1440x1800.png"))


def feed_02_language_split():
    """Madrid language reversal. Run 20260730-0613. No engine count, either way."""
    sh, y = feed_shell(
        "MADRID, COLLECTED 10 JULY 2026",
        "One question, asked in two languages, answered in opposite directions.",
        "Hotels near Madrid-Barajas. The same prompt put to AI once in Spanish and "
        "once in English, on one collection day.",
        vig=(0.20, 0.05))

    groups = [
        ("One engine", [("English", "full answer", OK),
                        ("Spanish", "nothing usable", BAD)]),
        ("Another engine", [("Spanish", "real answer", OK),
                            ("English", "nothing", BAD)]),
    ]
    title_h, pair_h, group_gap = 62, 56, 44
    gh = title_h + pair_h * 2
    note = ("A further engine failed to collect on every Madrid prompt that run, "
            "so no engine count is given here.")
    nh = note_height(note, FEED_COL - CARD_PAD * 2)
    card_h = CARD_PAD * 2 + CARD_HEAD + gh * 2 + group_gap + 44 + nh
    x0, y0 = place_card(sh, y, card_h)

    sh.text((x0 + CARD_PAD, y0 + CARD_PAD), "SAME PROMPT, SAME DAY",
            font("SemiBold", 24), T3, surface=S, tracking=0.15, label="card head")

    gy = y0 + CARD_PAD + CARD_HEAD
    for i, (who, pairs) in enumerate(groups):
        sh.text((x0 + CARD_PAD, gy), who, font("SemiBold", 44), T, surface=S,
                label="card group")
        for j, (langue, result, col) in enumerate(pairs):
            ly = gy + title_h + j * pair_h
            sh.text((x0 + CARD_PAD, ly), langue, font("Medium", 34), T2, surface=S,
                    label="card sub")
            sh.text((x0 + CARD_PAD + 270, ly), result, font("SemiBold", 34), col,
                    surface=S, label="card value")
        gy += gh
        if i < len(groups) - 1:
            sh.rule(x0 + CARD_PAD, x0 + FEED_COL - CARD_PAD, gy + group_gap / 2)
            gy += group_gap

    card_note(sh, x0, gy + 44, note, FEED_COL - CARD_PAD * 2)
    feed_footer(sh)
    sh.save(os.path.join(FEED, "fb-feed-02-language-split-1440x1800.png"))


def feed_03_placement():
    """Chicago artefact. Run 20260730-0216. Five engines, carried with its date."""
    sh, y = feed_shell(
        "CHICAGO, COLLECTED 24 JULY 2026",
        "Five engines named the same company. They did not agree on the order.",
        'One question, put to five AI engines on one collection day: '
        '"Top-rated property management companies in Chicago".',
        vig=(0.84, 0.06))

    rows = [("ChatGPT", "1st", ACT), ("Claude", "1st", ACT), ("Perplexity", "2nd", ACT),
            ("Gemini", "4th", PARTIAL), ("Google AI Mode", "named", T2)]
    rh = 84
    note = "All five engines returned usable data on every prompt that run."
    nh = note_height(note, FEED_COL - CARD_PAD * 2)
    card_h = CARD_PAD * 2 + CARD_HEAD + rh * len(rows) + 44 + nh
    x0, y0 = place_card(sh, y, card_h)

    sh.text((x0 + CARD_PAD, y0 + CARD_PAD), "WHERE IT LANDED", font("SemiBold", 24),
            T3, surface=S, tracking=0.15, label="card head")
    sh.text((x0 + FEED_COL - CARD_PAD, y0 + CARD_PAD), "ONE COMPANY, NOT NAMED HERE",
            font("SemiBold", 24), T3, surface=S, anchor="ra", tracking=0.15,
            label="card head")

    for i, (engine, rank, col) in enumerate(rows):
        ry = y0 + CARD_PAD + CARD_HEAD + rh * i
        cyc = ry + rh * 0.5
        sh.text((x0 + CARD_PAD, cyc), engine, font("Medium", 44), T, surface=S,
                anchor="lm", label="card row")
        sh.text((x0 + FEED_COL - CARD_PAD, cyc), rank, font("SemiBold", 44), col,
                surface=S, anchor="rm", label="card value")
        if i < len(rows) - 1:
            sh.rule(x0 + CARD_PAD, x0 + FEED_COL - CARD_PAD, ry + rh)

    card_note(sh, x0, y0 + CARD_PAD + CARD_HEAD + rh * len(rows) + 44, note,
              FEED_COL - CARD_PAD * 2)
    feed_footer(sh)
    sh.save(os.path.join(FEED, "fb-feed-03-placement-1440x1800.png"))


def feed_04_rank_vs_answer():
    """BG-004. Run 20260730-0113. No engine count anywhere on this one."""
    sh, y = feed_shell(
        "ONE BRAND, TWENTY QUESTIONS, JULY 2026",
        "Page one on Google. Absent from one AI engine's answers.",
        "We audited a brand that reaches page one of Google without trying hard. "
        "Twenty real customer questions, identical across every engine we put "
        "them to.",
        vig=(0.18, 0.06))

    stats = [("3", "engines where it was the #1 recommendation", ACT),
             ("0", "times it appeared anywhere in one engine's answers", BAD)]
    rh = 150
    note = ("It held that slot consistently across the majority of the twenty "
            "questions, not on every one. The audit ran an engine lineup we no "
            "longer run, so no engine count is given here.")
    nh = note_height(note, FEED_COL - CARD_PAD * 2)
    card_h = CARD_PAD * 2 + CARD_HEAD + rh * len(stats) + 44 + nh
    x0, y0 = place_card(sh, y, card_h)

    sh.text((x0 + CARD_PAD, y0 + CARD_PAD), "THE SAME BRAND, THE SAME TWENTY QUESTIONS",
            font("SemiBold", 24), T3, surface=S, tracking=0.15, label="card head")

    for i, (num, label, col) in enumerate(stats):
        ry = y0 + CARD_PAD + CARD_HEAD + rh * i
        cyc = ry + rh * 0.5
        sh.text((x0 + CARD_PAD, cyc), num, font("ExtraBold", 118), col, surface=S,
                anchor="lm", label="card stat")
        f_l = font("Medium", 36)
        ls = wrap(label, f_l, FEED_COL - CARD_PAD * 2 - 215)
        sh.block((x0 + CARD_PAD + 215, cyc - (len(ls) * f_l.size * 1.32) / 2 - 6),
                 ls, f_l, T2, surface=S, leading=1.32, label="card stat label")
        if i < len(stats) - 1:
            sh.rule(x0 + CARD_PAD, x0 + FEED_COL - CARD_PAD, ry + rh)

    card_note(sh, x0, y0 + CARD_PAD + CARD_HEAD + rh * len(stats) + 44, note,
              FEED_COL - CARD_PAD * 2)
    feed_footer(sh)
    sh.save(os.path.join(FEED, "fb-feed-04-rank-vs-answer-1440x1800.png"))


# ============================================================ link cards ====
LINK_W, LINK_H = 1200, 630
LINK_PAD = 64
LOCK_H_LINK = 76


def link_card(fname, eyebrow, headline, sub, vig=(0.86, 0.10), accent_second=False):
    """1200x630. Read at thumbnail size in a scrolling feed, so: one eyebrow,
    a headline of at most two lines, one qualifier line, and the domain. Nothing
    else. Anything that needs a third line belongs on the feed image instead."""
    sh = Sheet(LINK_W, LINK_H)
    vignette(sh.im, LINK_W * vig[0], LINK_H * vig[1], LINK_W * 0.72, AC, 0.15)

    sh.lockup(LINK_PAD, LINK_PAD, LOCK_H_LINK, anchor="lt")
    top = LINK_PAD + LOCK_H_LINK + LOCK_H_LINK * 0.6975 + 10

    col = LINK_W - LINK_PAD * 2
    sh.text((LINK_PAD, top), eyebrow, font("SemiBold", 22), ACT, tracking=0.16,
            label="eyebrow")

    f_h, lines = fit_wrap(headline, "Bold", 68, col, 2, floor=40)
    y = sh.block((LINK_PAD, top + 50), lines, f_h, T, leading=1.12, label="headline")

    y += 14
    sh.bar((LINK_PAD, y), 132, 8, ACS)
    y += 8 + 34

    f_s = font("Regular", 27)
    sh.block((LINK_PAD, y), wrap(sub, f_s, col), f_s, T2, leading=1.40, label="sub")

    sh.text((LINK_W - LINK_PAD, LINK_H - LINK_PAD - 6), "getbrandgeo.com",
            font("Medium", 24), T3, anchor="rb", label="domain")
    sh.save(os.path.join(LINK, fname))
    del accent_second


def link_cards():
    link_card(
        "fb-link-01-description-1200x630.png",
        "FREE AI VISIBILITY AUDIT",
        "Read the description before your buyer does.",
        "An AI can name your company and still describe it wrong.",
        vig=(0.88, 0.08))

    link_card(
        "fb-link-02-madrid-1200x630.png",
        "MADRID, COLLECTED 10 JULY 2026",
        "The same question, answered in opposite directions.",
        "Once in Spanish, once in English. One prompt, one city, one day.",
        vig=(0.14, 0.10))

    link_card(
        "fb-link-03-chicago-1200x630.png",
        "CHICAGO, COLLECTED 24 JULY 2026",
        "Five engines named the same company. Three different ranks.",
        "First, first, second, fourth, and one that named it with no position at all.",
        vig=(0.88, 0.12))

    link_card(
        "fb-link-04-bg004-1200x630.png",
        "AUDIT, PUBLISHED 2 JULY 2026",
        "Page one on Google. Zero mentions on one AI engine.",
        "One brand, twenty identical customer questions.",
        vig=(0.16, 0.08))


# ------------------------------------------------------------------ main ----
def report():
    print(f"\nwrote {len(WRITTEN)} files")
    for p in WRITTEN:
        im = Image.open(p)
        print(f"  {os.path.relpath(p, FB):<44} {im.width}x{im.height}  "
              f"{os.path.getsize(p) / 1024:8.1f} KB  {im.format}")

    print("\ncontrast, measured against the surface each string sits on:")
    worst_body, worst_large = 99.0, 99.0
    for (fg, bg, role, large), r in sorted(MEASURED.items(), key=lambda kv: kv[1]):
        floor = 3.0 if large else 4.5
        ok = "PASS" if r >= floor else "FAIL"
        kind = "large" if large else "body "
        if large:
            worst_large = min(worst_large, r)
        else:
            worst_body = min(worst_body, r)
        print(f"  {role:<18} {fg} on {bg}  {kind}  {r:6.2f}:1  need {floor}  {ok}")
    print(f"  lowest body ratio  {worst_body:.2f}:1")
    print(f"  lowest large ratio {worst_large:.2f}:1")
    assert worst_body >= 4.5 and worst_large >= 3.0, "a measured ratio failed"
    # #8b5cf6 is a fill. Assert it was never handed to text().
    assert not any(fg.lower() == AC for (fg, _, _, _) in MEASURED), \
        "#8b5cf6 was used as a text colour"
    print("  #8b5cf6 used as fill only: confirmed, it reached no text() call")


def verify_backgrounds():
    """Contrast against the REAL background, not against the token.

    The token table says `#9ba1ac` on `#0a0b0e` is 7.58:1. That is only true
    where the canvas is actually `#0a0b0e`. Every sheet carries a violet
    vignette, which lightens the field it passes over, and a light string on a
    lightened dark field measures LOWER than the token table claims.

    So: re-render every sheet with `NO_TEXT` set, which draws the vignette, the
    cards and the rules but no type. Then, for each string that was drawn, take
    the LIGHTEST background pixel inside its own ink bbox out of that control and
    compute the ratio against it. Worst case per string, measured, not assumed."""
    global NO_TEXT
    NO_TEXT = True
    SHEETS.clear()
    build_all()
    control = {p: np.asarray(sh.im).astype(np.float32) for p, sh in SHEETS.items()}
    NO_TEXT = False
    SHEETS.clear()
    build_all()

    print("\ncontrast against the MEASURED background under each string,")
    print("sampled from a text-free re-render of the same sheet:")
    rows, worst_body, worst_large = [], (99.0, ""), (99.0, "")
    for path, sh in SHEETS.items():
        bgpx = control[path]
        for (x0, y0, x1, y1), fill, label, large in sh.text_specs:
            a = bgpx[max(0, int(y0)):int(y1) + 1, max(0, int(x0)):int(x1) + 1]
            if a.size == 0:
                continue
            lums = np.apply_along_axis(lambda c: lum(tuple(c)), 2, a)
            idx = np.unravel_index(np.argmax(lums), lums.shape)
            worst_bg = tuple(int(v) for v in a[idx[0], idx[1]])
            r = contrast(fill, worst_bg)
            key = (os.path.basename(path), label, fill, worst_bg, large)
            rows.append((r, key))
            if large:
                if r < worst_large[0]:
                    worst_large = (r, key)
            elif r < worst_body[0]:
                worst_body = (r, key)
    seen = {}
    for r, key in sorted(rows):
        k = key[1:4]
        if k in seen:
            continue
        seen[k] = True
        name, label, fill, bg, large = key
        floor = 3.0 if large else 4.5
        print(f"  {label:<18} {fill} on measured #{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}  "
              f"{'large' if large else 'body '}  {r:6.2f}:1  need {floor}  "
              f"{'PASS' if r >= floor else 'FAIL'}")
    print(f"  worst body  {worst_body[0]:.2f}:1  ({worst_body[1][1]} on "
          f"{worst_body[1][0]})")
    print(f"  worst large {worst_large[0]:.2f}:1  ({worst_large[1][1]} on "
          f"{worst_large[1][0]})")
    assert worst_body[0] >= 4.5, f"body text at {worst_body[0]:.2f}:1 on the real background"
    assert worst_large[0] >= 3.0, f"large text at {worst_large[0]:.2f}:1 on the real background"


def build_all():
    os.makedirs(FEED, exist_ok=True)
    os.makedirs(LINK, exist_ok=True)
    feed_01_description()
    feed_02_language_split()
    feed_03_placement()
    feed_04_rank_vs_answer()
    link_cards()


def main():
    build_all()
    report()
    print("\nfindings and their sources:")
    for k, v in FINDINGS.items():
        print(f"  {k}\n    notes: {v['source']}\n    page:  {v['page']}\n"
              f"    limit: {v['note']}")


if __name__ == "__main__":
    if "--verify-bg" in sys.argv:
        verify_backgrounds()
    else:
        main()
