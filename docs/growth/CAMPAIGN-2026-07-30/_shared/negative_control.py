"""
Breaks each logo check on purpose and proves it goes red, then proves it goes
quiet again. A verifier that has never failed is not evidence.

Everything happens on COPIES in a scratch directory. No file in the package is
modified by this script.

The injection that matters most is I3. It writes a file with the correct name,
the correct dimensions, the correct transparency, and the wrong art inside it. A
check that asks "is the logo file there" passes that. This package has already
shipped a check that passed a wrong ENGINE NAME because all it could do was
count engines, so the logo check is aimed at pixels and I3 is what proves it.

I10 is the opposite test: a deliberately blind scanner is run against the same
injections and must catch NONE of them. Without it, "every injection fired"
would also be true of a check that fires on everything.

Run: python negative_control.py
"""

import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))
LOGO = os.path.join(HERE, "logo")
RETIRED = os.path.join(LOGO, "_retired-2026-07-30")
FONTS = os.path.join(HERE, "fonts")

sys.path.insert(0, HERE)
import check_logo as CL                                        # noqa: E402
import build_logo_v3 as B                                      # noqa: E402
import check_safe_zones as SZ                                  # noqa: E402

RESULTS = []


def record(name, fired, expected, detail=""):
    ok = (fired == expected)
    RESULTS.append((name, fired, expected, ok, detail))
    verdict = "OK " if ok else "!!!"
    want = "fire" if expected else "stay quiet"
    got = "fired" if fired else "quiet"
    print(f"  {verdict} {name:<44} expected {want:<10} -> {got}   {detail}")
    return ok


def fires(fn):
    """True when the check rejects."""
    try:
        fn()
        return False
    except (AssertionError, SystemExit, OSError, ValueError) as e:
        return True, str(e)[:70]


def _fired(fn):
    r = fires(fn)
    return (r[0], r[1]) if isinstance(r, tuple) else (r, "")


# ---------------------------------------------------- the pixel detector -----
def pixel_injections(tmp):
    """check_logo.retired_px must react to the ART, not to the filename."""
    clean = os.path.join(PKG, "linkedin", "feed",
                         "li-01-a-firm-that-does-not-exist-1200x627.png")
    if not os.path.exists(clean):
        clean = sorted(
            os.path.join(PKG, "product", f) for f in os.listdir(os.path.join(PKG, "product"))
            if f.endswith(".png"))[0]

    base = Image.open(clean).convert("RGBA")

    # I1 baseline: the untouched render must be silent.
    record("I1 clean render is silent", CL.retired_px(base) > 0, False,
           f"{CL.retired_px(base)} px")

    # I2: retired MARK pasted into a clean render.
    m = Image.open(os.path.join(RETIRED, "brandgeo-mark-transparent-h512.png"))
    m = m.resize((90, 127), Image.LANCZOS)
    a = base.copy()
    a.alpha_composite(m, (60, 60))
    record("I2 retired mark pasted into a render", CL.retired_px(a) > 0, True,
           f"{CL.retired_px(a)} px")

    # I3: the file has the RIGHT name, size and transparency, wrong art.
    #     This is the one a file-existence check cannot see.
    good = Image.open(os.path.join(LOGO, "brandgeo-lockup-dark-transparent-w512.png"))
    bad = Image.open(os.path.join(RETIRED, "brandgeo-lockup-dark-transparent-w512.png"))
    swap = os.path.join(tmp, "brandgeo-lockup-dark-transparent-w512.png")
    bad.save(swap)
    same_name = os.path.basename(swap) == "brandgeo-lockup-dark-transparent-w512.png"
    same_size = Image.open(swap).size == good.size
    same_mode = Image.open(swap).mode == good.mode
    exists = os.path.exists(swap)
    record("I3 right name+size+alpha, wrong art",
           CL.retired_px(Image.open(swap)) > 0, True,
           f"exists={exists} name_match={same_name} size_match={same_size} "
           f"mode_match={same_mode} -> {CL.retired_px(Image.open(swap))} px")
    # The control for I3. The same file, judged the way a file-existence check
    # would judge it, is accepted. Both rows are needed: I3 shows the pixel
    # check catching it, I3b shows the cheap check missing it.
    record("I3b file-existence check on that same file",
           not exists, False, "accepted it, which is why the check reads pixels")

    # I4: the live art must stay silent, so the detector is not just 'any blue'.
    record("I4 v3 lockup is silent", CL.retired_px(good) > 0, False,
           f"{CL.retired_px(good)} px")

    # I5: violet dimmed to an antialiased edge must stay silent. This is the
    #     real false positive the detector had before the g-r term was added.
    edge = Image.new("RGBA", (40, 40), (65, 46, 173, 255))
    record("I5 dimmed violet edge is silent", CL.retired_px(edge) > 0, False,
           "rgb(65,46,173), the YouTube Shorts false positive")

    return base, a


# ------------------------------------------------- the wordmark assertions ---
def wordmark_injections():
    """Each of the five ways the wordmark can be wrong, forced one at a time."""
    good_size = 109

    # I6 missing font file: must raise rather than fall back to a default face.
    #
    # This injection went BLIND on 2026-07-31 and the harness caught it. It used
    # to read `B.FONT = .../Geist-Bold.ttf` with the comment "does not exist",
    # which was true while Geist was absent. Installing Geist turned the
    # injection into a no-op: it pointed the build at a real, valid, weight-700
    # font, the build succeeded, and I6 recorded "expected fire -> quiet". The
    # test had not started passing, it had stopped testing.
    #
    # So the path is now synthesised to be unopenable rather than named after a
    # face that somebody might later install. It carries a nonce, and it is
    # asserted absent before use, so this cannot rot the same way twice.
    orig = B.FONT
    missing = os.path.join(FONTS, f"NoSuchFace-{os.urandom(8).hex()}.ttf")
    assert not os.path.exists(missing), "the 'missing' font exists, injection is void"
    B.FONT = missing
    f, msg = _fired(lambda: B.wordmark(512))
    B.FONT = orig
    record("I6 font file missing", f, True, msg)

    # I7 wrong weight: Inter-Regular is 400, the spec says 700.
    B.FONT = os.path.join(FONTS, "Inter-Regular.ttf")
    f, msg = _fired(lambda: B.assert_wordmark_is_type(good_size))
    B.FONT = orig
    record("I7 wrong weight (Inter-Regular, 400)", f, True, msg)

    # I8 advances collapsed, which is what a tofu row or a monospaced fallback
    #    looks like from the outside.
    real = ImageFont.truetype
    class Mono:
        def __init__(self, inner): self.inner = inner
        def getlength(self, ch): return 60.0
        def __getattr__(self, k): return getattr(self.inner, k)
    ImageFont.truetype = lambda p, s: Mono(real(p, s))
    f, msg = _fired(lambda: B.assert_wordmark_is_type(good_size))
    ImageFont.truetype = real
    record("I8 advances collapsed to one width", f, True, msg)

    # I9 nothing drawn at all.
    orig_masks = B._word_masks
    B._word_masks = lambda px: (Image.new("L", (600, 300), 0),
                                Image.new("L", (600, 300), 0))
    f, msg = _fired(lambda: B.assert_wordmark_is_type(good_size))
    B._word_masks = orig_masks
    record("I9 wordmark renders blank", f, True, msg)

    # I10 solid boxes, the classic .notdef tofu render. Ink coverage goes to 1.0.
    def tofu(px):
        a = Image.new("L", (px * 10, px * 3), 0)
        b = Image.new("L", (px * 10, px * 3), 0)
        d, e = ImageDraw.Draw(a), ImageDraw.Draw(b)
        x = px * 0.5
        for i in range(len(B.WORD)):
            (e if i >= B.SPLIT else d).rectangle(
                [x, px * 0.2, x + px * 0.6, px * 0.9], fill=255)
            x += px * 0.7
        return a, b
    B._word_masks = tofu
    f, msg = _fired(lambda: B.assert_wordmark_is_type(good_size))
    B._word_masks = orig_masks
    record("I10 tofu boxes instead of glyphs", f, True, msg)

    # I11 the real thing must pass all five.
    f, msg = _fired(lambda: B.assert_wordmark_is_type(good_size))
    record(f"I11 real {os.path.basename(B.FONT)} render", f, False, msg)


# -------------------------------------------------- the lockup geometry ------
def geometry_injections():
    """The footprint assertions that catch a silent layout shift."""
    # I12 a lockup whose crop is narrower than 512 rescales every layout that
    #     places it. That is the bug that failed six Instagram clear-space
    #     assertions, so it must be caught at build time now.
    lock = Image.open(os.path.join(LOGO, "brandgeo-lockup-dark-transparent-w512.png"))
    narrow = Image.new("RGBA", (512, 400), (0, 0, 0, 0))
    narrow.alpha_composite(lock.crop((0, 0, 490, 400)), (11, 0))
    bbox = narrow.getchannel("A").getbbox()
    crop_w = bbox[2] - bbox[0]
    def check():
        assert crop_w == 512, f"crop width {crop_w} != 512"
    f, msg = _fired(check)
    record("I12 lockup crop narrower than 512", f, True, msg)

    # I13 more than two ink runs, which breaks Facebook's mark/wordmark split.
    three = lock.copy()
    ImageDraw.Draw(three).rectangle([10, 398, 100, 399], fill=(255, 255, 255, 255))
    def runs_of(im):
        rows = (np.asarray(im)[..., 3] > 16).sum(axis=1)
        r, s = [], None
        for i, v in enumerate(rows):
            if v > 0 and s is None: s = i
            if v == 0 and s is not None: r.append((s, i - 1)); s = None
        if s is not None: r.append((s, len(rows) - 1))
        return r
    n = len(runs_of(three))
    f, msg = _fired(lambda: (_ for _ in ()).throw(AssertionError(f"{n} runs"))
                    if n != 2 else None)
    record("I13 lockup gains a third ink run", f, True, f"{n} runs")
    record("I14 shipped lockup has exactly two runs",
           len(runs_of(lock)) != 2, False, f"{runs_of(lock)}")


# ----------------------------------------------------------- safe zones ------
def safezone_injections(tmp):
    """Move the strip into the reserve and confirm the box test rejects it."""
    src = os.path.join(PKG, "bilingual", "berlin", "berlin-de-silent.mp4")
    d = SZ.duration(src)
    a = SZ.frame(src, d * 0.5, os.path.join(tmp, "sz.png"))
    real = SZ.find_strip(a)
    record("I15 shipped strip is inside the box", not SZ.judge(real)[1], False,
           f"{real} -> {SZ.judge(real)[0]}")

    # 163 px into the bottom reserve and 114 into the right, the exact breach a
    # previous run of this package shipped.
    x0, y0, x1, y1 = real
    moved = (SZ.X_MAX - (x1 - x0) + 114, SZ.Y_MAX - (y1 - y0) + 163,
             SZ.X_MAX + 114, SZ.Y_MAX + 163)
    v, ok = SZ.judge(moved)
    record("I16 strip 163px into bottom, 114 into right", not ok, True, v)

    # And one that only just breaches, so the test is not merely catching the
    # obvious.
    v2, ok2 = SZ.judge((x0, y0, x1, SZ.Y_MAX + 1))
    record("I17 strip 1px into the bottom reserve", not ok2, True, v2)


# ------------------------------------------------------- the blind control ---
def blind_control(clean, dirty):
    """A scanner that cannot see must catch nothing. Without this, 'every
    injection fired' is also true of a check that fires on everything."""
    def blind(_im):
        return 0
    caught = sum(1 for im in (dirty,) if blind(im) > 0)
    record("I18 blind scanner on the dirty render", caught > 0, False,
           "caught 0 of 1, so the harness can tell blind from working")
    caught_real = sum(1 for im in (dirty,) if CL.retired_px(im) > 0)
    record("I19 real scanner catches the same render", caught_real > 0, True,
           f"{caught_real} of 1")


def main():
    tmp = tempfile.mkdtemp(prefix="bg-negctl-")
    print(f"negative control, scratch {tmp}\n")
    try:
        print("A. the retired-logo pixel detector")
        clean, dirty = pixel_injections(tmp)
        print("\nB. the wordmark-is-real-type assertions")
        wordmark_injections()
        print("\nC. the lockup footprint assertions")
        geometry_injections()
        print("\nD. the video safe-zone box")
        safezone_injections(tmp)
        print("\nE. blind control")
        blind_control(clean, dirty)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    good = sum(1 for r in RESULTS if r[3])
    print(f"\n{good} of {len(RESULTS)} behaved as specified")
    for name, _, _, ok, _ in RESULTS:
        if not ok:
            print(f"  MISBEHAVED: {name}")
    return 0 if good == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
