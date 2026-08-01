"""
Proves Inter actually rendered, rather than the platform fallback.

Reads out/FontProbe.png, which renders one probe string twice: row A in the
real Inter stack, row B in a family that cannot resolve and is therefore
guaranteed to be the platform fallback.

If Inter loaded, the two rows are set in different faces and their ink differs.
If Inter did not load, row A fell through to the same fallback as row B and the
two rows are pixel-identical. That equality is the failure signal, and it is
the only way to catch this class of bug from a delivered file: a frame set in
the wrong font still looks like a frame set in a font.

Ink count alone would be a weak test, since two different faces can coincide on
a total. So the comparison is on the ink count AND on the per-column ink
profile, which encodes where the glyphs actually sit.

Usage:
    python tools/check_fonts.py
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
PROBE = os.path.join(ROOT, "out", "FontProbe.png")

INK = 45
# Bands the two probe rows occupy in FontProbe.tsx. Row label at top, glyphs
# below it; these cover the glyph band only.
ROW_A = (155, 275)
ROW_B = (435, 555)

# Two faces rendering the same string at the same size differ by more than this
# in total ink. Measured, not guessed: Inter ExtraBold against the Windows
# headless fallback differs by several percent on this string. The floor is set
# low enough that a near-miss still fails rather than squeaking through.
MIN_INK_DELTA = 0.02
MIN_PROFILE_DELTA = 0.02


def profile(band):
    """Per-column ink fraction. Encodes glyph positions and advance widths, so
    two faces that happen to match on total ink still differ here."""
    m = band.mean(axis=2) > INK
    return m.sum(axis=0).astype(float)


def compare(img):
    a = img[ROW_A[0]:ROW_A[1]]
    b = img[ROW_B[0]:ROW_B[1]]
    ia, ib = int((a.mean(axis=2) > INK).sum()), int((b.mean(axis=2) > INK).sum())
    if ia == 0 or ib == 0:
        return False, f"a row carried no ink at all (A={ia}, B={ib})"

    ink_delta = abs(ia - ib) / max(ia, ib)

    pa, pb = profile(a), profile(b)
    n = min(len(pa), len(pb))
    denom = max(pa[:n].sum(), pb[:n].sum()) or 1.0
    profile_delta = float(np.abs(pa[:n] - pb[:n]).sum() / denom)

    ok = ink_delta >= MIN_INK_DELTA or profile_delta >= MIN_PROFILE_DELTA
    detail = (f"A={ia}px B={ib}px  ink delta {ink_delta:.4f} "
              f"(floor {MIN_INK_DELTA})  profile delta {profile_delta:.4f} "
              f"(floor {MIN_PROFILE_DELTA})")
    return ok, detail


def main():
    if not os.path.exists(PROBE):
        print(f"MISSING {PROBE}. Render the FontProbe still first:")
        print("  npx remotion still src/index.ts FontProbe out/FontProbe.png")
        return 2
    img = np.asarray(Image.open(PROBE).convert("RGB")).astype(int)
    ok, detail = compare(img)
    print(f"{'PASS' if ok else 'FAIL'}  Inter distinct from platform fallback")
    print(f"      {detail}")
    if not ok:
        print("      Row A and row B are the same face, so Inter did not load "
              "and every frame in this project is set in the fallback.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
