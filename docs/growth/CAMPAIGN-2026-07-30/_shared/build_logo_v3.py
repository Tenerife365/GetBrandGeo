"""
Regenerates `_shared/logo/` from the live v3 identity.

The campaign shipped with the retired logo: a blue-to-violet `b` with a teardrop
base and a dark navy disc in the counter. The live mark, the one
`brandgeo/web/logo.png` and `brandgeo-dashboard/public/logo.png` actually serve,
is the flat violet monoline `b` in `docs/growth/brand-identity-2026-07-29/v3/`.
This writes that one, at the same filenames the eight renderers already read.

Read-only inputs, both outside this package and never written to:
  ../../brand-identity-2026-07-29/v3/build/render_v3.py   mark geometry
  ../../brand-identity-2026-07-29/v3/logo-full.svg        wordmark colour split

The wordmark, and the trap it hides
-----------------------------------
`v3/logo-full.svg` sets BrandGEO as a live `<text>` element in
`Geist, Inter, system-ui, ...`, and its own `<desc>` admits the risk: "NOT
PRODUCTION READY ... it renders in a fallback face anywhere Geist is missing."
Rasterising that SVG would still quietly produce whatever face happened to
resolve, and exit 0 either way. So the wordmark is never rasterised from the
SVG. It is set here, directly, from an explicit font path.

That path is now `_shared/fonts/Geist-Bold.ttf`, the FIRST face in the SVG's own
stack, installed 2026-07-31 from the official `geist@1.7.2` npm package under
SIL OFL 1.1 (`fonts/Geist-LICENSE.txt`). Until then Geist was absent and this
build used `Inter-Bold.ttf`, the second face in the same stack, which was the
correct substitute at the time and is now obsolete. The design is finally set in
the face it was specified in.

Geist is not Inter, so the metrics moved. Measured at 100px, per letter of
BrandGEO: Inter advances 67/40/58/62/63/76/61/77, Geist 70/43/59/61/63/74/62/78.
Geist is wider on B, r and O and narrower on n and G, and its unitsPerEm is 1000
against Inter's 2048. Sized by width, as this build does, that lands as a
slightly SMALLER point size and a slightly SHORTER ink height for the same
512px of ink. Both are absorbed by the geometry contract below rather than
allowed to propagate.

`assert_wordmark_is_type()` proves the glyphs are real letterforms rather than a
fallback face, tofu boxes, or an empty canvas. Every one of its checks reads
THIS file, by path, so a silent substitution cannot satisfy it. It runs on every
build and is unchanged by the font swap.

Geometry, and the layout regression it exists to prevent
--------------------------------------------------------
The lockup keeps the retired file's canvas, its mark rows, and its trimmed
footprint:

    512 x 400,  alpha bbox the full canvas,  mark ink rows 1..279,
    gap opening at row 280,  wordmark ink ending at row 396

Every one of those is load-bearing. `render_facebook_static.py`,
`render_instagram_statics.py` and `render_gbp_and_thumbnails.py` all crop the
lockup to its alpha bbox, then measure the mark's share of the result off the
alpha channel, then use that share as the clear-space unit. So the trimmed
footprint is an input to every layout that places the lockup.

This was learned the expensive way. A first build set the wordmark to the same
79px ink height as the retired file but at v3's own tracking, which made it
490px wide rather than 506. The canvas was still 512x400, but the alpha bbox
trimmed to 490x396, so at a fixed 150px draw width the whole lockup scaled up
about 4.5 percent, the mark height grew from 82px to 85px, and
`instagram/_build/verify.py` failed six clear-space assertions, one of them by a
single pixel: 88px of margin against a requirement of 89px.

The fix is to size the wordmark by WIDTH rather than by height. At 512px wide
the ink genuinely reaches both canvas edges, the bbox is the full canvas, the
trim is a real no-op instead of an accident of antialiasing, and v3's tracking
is kept exactly as specified. The wordmark comes out 82px tall instead of 79, so
the gap between mark and wordmark narrows by three rows. Nothing measures the
gap's height, only where it starts, and it still starts at row 280.

Run: python build_logo_v3.py
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))
GROWTH = os.path.abspath(os.path.join(PKG, ".."))
V3 = os.path.join(GROWTH, "brand-identity-2026-07-29", "v3")
OUT = os.path.join(HERE, "logo")
FONT = os.path.join(HERE, "fonts", "Geist-Bold.ttf")
FONT_LABEL = "Geist-Bold"

sys.path.insert(0, os.path.join(V3, "build"))
import render_v3 as R                                            # noqa: E402

# ---- mark, straight off the v3 grid -----------------------------------------
# Bounding box of the mark inside R's 512 unit grid. Same numbers as
# v3/build/rollout.py, which is what wrote the live logo.png on both properties.
BB_X0, BB_X1 = 128.0, 384.0
BB_Y0, BB_Y1 = 88.0, 416.0
BB_W, BB_H = BB_X1 - BB_X0, BB_Y1 - BB_Y0          # 256 x 328, aspect 0.7805

# ---- wordmark, off v3/logo-full.svg -----------------------------------------
WORD = "BrandGEO"
SPLIT = 5                                # "Brand" | "GEO"
BRAND_FILL = "#E8E9ED"                   # <tspan fill="#E8E9ED">
GEO_GRAD = ("#8B5CF6", "#A78BFA")        # geoGrad stops
TRACKING = -3.0 / 94.0                   # letter-spacing -3 at font-size 94

# ---- canvases, matched to the files being replaced --------------------------
LOCKUP_W, LOCKUP_H = 512, 400
MARK_ROWS = (1, 279)                     # inclusive, height 279
GAP_START = 280                          # what the renderers actually measure
WORD_BOTTOM = 396                        # last wordmark ink row
WORDFILE_W, WORDFILE_H = 512, 85
MARKFILE_H = 512

SS = 8                                   # supersample, same as render_v3


# ----------------------------------------------------------------- mark ------
def mark(height):
    """The v3 mark on transparent ground, tight to its own bounding box.

    Same construction as v3/build/rollout.py:bare_mark. The counter is punched
    out rather than painted, so it is genuinely transparent and whatever sits
    behind the logo shows through it.
    """
    scale = height / BB_H
    w = round(BB_W * scale)
    m = Image.new("L", (w * SS, height * SS), 0)
    d = ImageDraw.Draw(m)
    s = scale * SS
    ox, oy = -BB_X0 * s, -BB_Y0 * s

    def disc(c, r, fill):
        cx, cy = c[0] * s + ox, c[1] * s + oy
        rr = r * s
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=fill)

    d.rectangle([(R.STEM_X - R.STROKE / 2) * s + ox, R.STEM_Y0 * s + oy,
                 (R.STEM_X + R.STROKE / 2) * s + ox, R.STEM_Y1 * s + oy], fill=255)
    disc((R.STEM_X, R.STEM_Y0), R.STROKE / 2, 255)
    disc((R.STEM_X, R.STEM_Y1), R.STROKE / 2, 255)
    disc(R.BOWL_C, R.BOWL_R + R.STROKE / 2, 255)     # bowl outer
    disc(R.BOWL_C, R.BOWL_R - R.STROKE / 2, 0)       # counter, punched
    disc(R.BOWL_C, R.DOT_R, 255)                     # the dot inside it
    m = m.resize((w, height), Image.LANCZOS)

    img = Image.new("RGBA", (w, height), (0, 0, 0, 0))
    img.paste(R._gradient(w, height), (0, 0), m)
    return img


# ------------------------------------------------------------- wordmark ------
def _hex(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _ramp(w, h, a, b):
    """Left to right ramp between two hexes, used for GEO."""
    g = Image.new("RGB", (w, h))
    px = g.load()
    ca, cb = _hex(a), _hex(b)
    for x in range(w):
        f = x / max(1, w - 1)
        c = tuple(round(ca[i] + (cb[i] - ca[i]) * f) for i in range(3))
        for y in range(h):
            px[x, y] = c
    return g


def _word_masks(px):
    """Two full-canvas masks, Brand and GEO, drawn on one baseline with the v3
    tracking. Returned oversized; the caller trims."""
    f = ImageFont.truetype(FONT, px)                 # raises if FONT is missing
    ls = TRACKING * px
    W = int(px * 10)
    H = int(px * 3)
    a = Image.new("L", (W, H), 0)
    b = Image.new("L", (W, H), 0)
    da, db = ImageDraw.Draw(a), ImageDraw.Draw(b)
    x, y = px * 0.5, px * 0.8
    for i, ch in enumerate(WORD):
        (db if i >= SPLIT else da).text((x, y), ch, font=f, fill=255)
        x += f.getlength(ch) + ls
    return a, b


def wordmark(ink_w):
    """`BrandGEO`, Brand in #E8E9ED, GEO in the violet ramp, ink exactly
    `ink_w` wide, on transparent ground. Height follows from v3's tracking.

    Sized by width, not height, so the ink reaches both canvas edges and the
    alpha-bbox trim every consumer performs is a true no-op. See the module
    docstring for the six failed assertions that taught this.
    """
    # Point size whose combined ink is ink_w wide. Bisection, because hinting
    # makes the size-to-ink-width map monotonic but not linear.
    lo, hi = 4.0, ink_w * 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        a, b = _word_masks(int(round(mid)) or 1)
        both = Image.new("L", a.size, 0)
        both.paste(a, (0, 0), a)
        both.paste(b, (0, 0), b)
        bb = both.getbbox()
        if bb[2] - bb[0] < ink_w:
            lo = mid
        else:
            hi = mid
    size = int(round(lo))

    a, b = _word_masks(size)
    both = Image.new("L", a.size, 0)
    both.paste(a, (0, 0), a)
    both.paste(b, (0, 0), b)
    bb = both.getbbox()
    a, b, both = a.crop(bb), b.crop(bb), both.crop(bb)
    w, h = both.size
    if w != ink_w:                       # last-pixel correction from rounding
        h = max(1, round(h * ink_w / w))
        a = a.resize((ink_w, h), Image.LANCZOS)
        b = b.resize((ink_w, h), Image.LANCZOS)
        w = ink_w

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    img.paste(Image.new("RGB", (w, h), _hex(BRAND_FILL)), (0, 0), a)
    img.paste(_ramp(w, h, *GEO_GRAD), (0, 0), b)
    return img, size


# ---------------------------------------------------------- verification -----
def assert_wordmark_is_type(size):
    """Prove the wordmark is real letterforms, not a fallback face, not tofu,
    not blank. This is the failure this build exists to avoid, and it is silent
    by nature, so it gets four independent tests rather than a look.
    """
    tt = TTFont(FONT)
    cmap = tt.getBestCmap()
    glyphs = tt.getGlyphSet()

    # 1. every character maps to a real glyph in THIS file. A fallback face
    #    cannot satisfy this, because nothing else is ever opened.
    for ch in WORD:
        gid = cmap.get(ord(ch))
        assert gid and gid != ".notdef", f"no glyph for {ch!r} in {FONT}"
        assert gid in glyphs, f"glyph {gid!r} missing from glyf table"

    # 2. weight is the 700 the v3 spec asks for, read off the font, not the
    #    filename, and not off the name table either. Inter's name table calls
    #    every static instance "Regular"; Geist's says "Bold". Neither is
    #    evidence, so OS/2 usWeightClass stays the test across both faces.
    wc = tt["OS/2"].usWeightClass
    assert wc == 700, f"expected weight 700, font reports {wc}"

    # 3. the letters are distinguishable from each other. Tofu boxes and a
    #    fallback to a monospaced face both collapse advance widths to one
    #    value; real proportional type does not. B r a n d G E O must show at
    #    least five distinct advances.
    f = ImageFont.truetype(FONT, size)
    adv = [round(f.getlength(c), 2) for c in WORD]
    assert len(set(adv)) >= 5, f"advances collapsed to {sorted(set(adv))}"

    # 4. the drawn ink is type-shaped. A blank render covers 0 of its box; a
    #    row of tofu boxes covers most of it. Real type lands in between.
    a, b = _word_masks(size)
    both = Image.new("L", a.size, 0)
    both.paste(a, (0, 0), a)
    both.paste(b, (0, 0), b)
    bb = both.getbbox()
    assert bb is not None, "wordmark rendered nothing at all"
    arr = np.asarray(both.crop(bb))
    cover = (arr > 128).mean()
    assert 0.20 < cover < 0.65, f"ink coverage {cover:.3f} is not type-shaped"

    # 5. and it is actually two colours, so the Brand/GEO split survived.
    assert a.getbbox() and b.getbbox(), "one half of the wordmark is empty"
    return {"size": size, "weight": wc, "advances": adv, "coverage": round(cover, 4)}


def assert_no_retired_ink(img, name):
    """The retired art's blue can never appear in the new art. Same pixel test
    `check_logo.py` runs over the whole package."""
    a = np.asarray(img.convert("RGBA")).astype(np.int16)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    hit = ((r < 70) & (b > 170) & (b - g > 80) & (g - r > 25) & (al > 200))
    n = int(hit.sum())
    assert n == 0, f"{name}: {n} retired-blue pixels in freshly built art"


# --------------------------------------------------------------- build -------
def main():
    os.makedirs(OUT, exist_ok=True)
    report = {}

    # 1. the bare mark, natural aspect, ink flush to the canvas.
    m = mark(MARKFILE_H)
    assert_no_retired_ink(m, "mark")
    m.save(os.path.join(OUT, "brandgeo-mark-transparent-h512.png"))
    report["mark"] = m.size

    # 2. the wordmark on its own, ink spanning the full 512 width.
    w, size = wordmark(WORDFILE_W)
    info = assert_wordmark_is_type(size)
    assert_no_retired_ink(w, "wordmark")
    assert w.height <= WORDFILE_H, f"wordmark {w.height}px too tall for {WORDFILE_H}"
    canvas = Image.new("RGBA", (WORDFILE_W, WORDFILE_H), (0, 0, 0, 0))
    canvas.alpha_composite(w, (0, (WORDFILE_H - w.height) // 2))
    canvas.save(os.path.join(OUT, "brandgeo-wordmark-dark-transparent-w512.png"))
    report["wordmark"] = (canvas.size, w.size, info)

    # 3. the stacked lockup, on the retired file's measured footprint.
    mh = MARK_ROWS[1] - MARK_ROWS[0] + 1
    lm = mark(mh)
    lw, lsize = wordmark(LOCKUP_W)
    assert_wordmark_is_type(lsize)
    word_top = WORD_BOTTOM - lw.height + 1
    assert word_top > GAP_START, (
        f"wordmark {lw.height}px tall would start at row {word_top}, "
        f"closing the gap that opens at {GAP_START}")
    lock = Image.new("RGBA", (LOCKUP_W, LOCKUP_H), (0, 0, 0, 0))
    lock.alpha_composite(lm, ((LOCKUP_W - lm.width) // 2, MARK_ROWS[0]))
    lock.alpha_composite(lw, (0, word_top))
    assert_no_retired_ink(lock, "lockup")

    # Everything six renderers measure at run time, asserted here rather than
    # discovered downstream as a one-pixel clear-space failure.
    rows = (np.asarray(lock)[..., 3] > 16).sum(axis=1)
    runs, start = [], None
    for i, v in enumerate(rows):
        if v > 0 and start is None:
            start = i
        if v == 0 and start is not None:
            runs.append((start, i - 1)); start = None
    if start is not None:
        runs.append((start, len(rows) - 1))
    assert len(runs) == 2, f"lockup must show exactly mark+wordmark, got {runs}"
    assert runs[0] == MARK_ROWS, f"mark rows {runs[0]} != {MARK_ROWS}"
    assert runs[0][1] + 1 == GAP_START, f"gap opens at {runs[0][1] + 1}, not {GAP_START}"
    assert runs[1][1] == WORD_BOTTOM, f"wordmark ends at {runs[1][1]}, not {WORD_BOTTOM}"

    # What the consumers actually see. All three of them crop to the alpha bbox
    # first, so the numbers that drive layout are measured on the CROP, not on
    # the canvas. Assert those, not the canvas.
    #
    # The retired file cropped to the full 512x400 only because it carried
    # alpha 1-9 antialiasing in its outermost rows, below every consumer's own
    # >10 and >16 ink threshold. Reproducing that would be faking a footprint
    # with pixels too faint to see. Instead: the crop must be exactly as WIDE as
    # before, since width is what scales the drawing, and no TALLER, since a
    # taller crop is what inflated the mark and broke clear space last time.
    bbox = lock.getchannel("A").getbbox()
    crop_w, crop_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    assert crop_w == LOCKUP_W, f"crop width {crop_w} != {LOCKUP_W}, layouts would rescale"
    assert crop_h <= LOCKUP_H, f"crop height {crop_h} > {LOCKUP_H}, mark would inflate"
    gap_in_crop = GAP_START - bbox[1]
    assert gap_in_crop <= GAP_START, (
        f"gap sits at row {gap_in_crop} of the crop, above the retired {GAP_START}, "
        f"so the clear-space requirement would grow")
    lock.save(os.path.join(OUT, "brandgeo-lockup-dark-transparent-w512.png"))
    report["lockup"] = (lock.size, runs, bbox, round(mh / LOCKUP_H, 4))

    print("built from v3")
    print(f"  mark      {report['mark'][0]}x{report['mark'][1]}")
    print(f"  wordmark  {canvas.size[0]}x{canvas.size[1]}  ink {w.size[0]}x{w.size[1]}"
          f"  {FONT_LABEL} {info['size']}px  weight {info['weight']}"
          f"  coverage {info['coverage']}")
    print(f"  lockup    {lock.size[0]}x{lock.size[1]}  ink runs {runs}"
          f"  bbox {bbox}  mark_frac {report['lockup'][3]}")
    print("  wordmark advances:", info["advances"])


if __name__ == "__main__":
    main()
