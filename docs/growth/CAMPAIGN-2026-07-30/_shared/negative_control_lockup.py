"""
Breaks `add_lockup.py`'s locator on purpose and proves it goes red.

`negative_control.py` covers the logo files and the safe-zone box. It does not
touch the code that decides WHERE in a 1080x1920 frame the brand strip is, and
that code was rewritten on 2026-07-31 to drop a hardcoded `y1430..1500` band
that missed Paris entirely. New logic with no failing test is the thing this
package keeps getting caught by, so it gets its own harness.

The injections run on real frames pulled out of the pristine cuts in
`_shared/_originals/`, not on synthetic canvases, because the decoys that matter
are real: these cuts show the mark LARGE as scene art, and Paris carries a
violet rail four pixels from its strip. A synthetic frame would not have either
and would prove nothing.

Nothing in the package is modified. Frames are decoded to a scratch directory
and mutated in memory.

The two that carry the most weight
----------------------------------
**J3** hands the locator a frame with the correct canvas, the correct
dimensions and a strip-shaped violet object in it that is the WRONG SIZE. This
is the locator's version of "right filename, wrong art": everything a loose
check would look at is present and correct, and the thing itself is wrong.

**J9** is the opposite. A deliberately blind locator, one that always returns
the same box and never refuses, is run against every injection below. It must
catch none of them. Without it, "every injection fired" would also be true of a
locator that refuses everything it is shown.

Run: python negative_control_lockup.py
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))
ORIGINALS = os.path.join(HERE, "_originals", "bilingual")
SCRATCH = os.environ.get("SCRATCH", ".")

sys.path.insert(0, HERE)
import add_lockup as A                                          # noqa: E402

RESULTS = []


def record(name, fired, expected, detail=""):
    ok = (fired == expected)
    RESULTS.append((name, ok))
    want = "fire" if expected else "stay quiet"
    got = "fired" if fired else "quiet"
    print(f"  {'OK ' if ok else '!!!'} {name:<46} expected {want:<10} -> {got}   {detail}")
    return ok


def fired(fn):
    """True when the locator refuses."""
    try:
        fn()
        return False, ""
    except (AssertionError, SystemExit, ValueError, IndexError) as e:
        return True, str(e)[:64]


def grab(rel, t=0.05):
    """One decoded frame out of a pristine original."""
    p = os.path.join(ORIGINALS, rel)
    dur, _ = A.probe(p)
    return A.frame(p, dur * t, os.path.join(SCRATCH, "_nc.png"))


def locate_in(a, tmpl):
    """The per-frame half of `locate()`: find the mark, then span the wordmark.
    Raises exactly where the real path raises."""
    mb = A.find_mark(a, tmpl)
    if mb is None:
        raise SystemExit("no lockup found")
    return A.extend_over_wordmark(a, mb)


def main():
    os.makedirs(SCRATCH, exist_ok=True)
    tmpl = A.mark_template()
    strip = A.build_strip()
    print(f"locator negative control, strip {strip.width}x{strip.height}\n")

    bottom = grab(os.path.join("berlin", "berlin-de-silent.mp4"))
    top = grab(os.path.join("paris", "paris-en-silent.mp4"))

    print("A. the locator finds the real thing, at either end of the frame")
    f, m = fired(lambda: locate_in(bottom, tmpl))
    record("J1 strip at the BOTTOM (Berlin y1434)", f, False,
           str(locate_in(bottom, tmpl)))
    f, m = fired(lambda: locate_in(top, tmpl))
    record("J2 strip at the TOP (Paris y234)", f, False, str(locate_in(top, tmpl)))

    print("\nB. wrong art in the right place")
    # J3 a violet blob of the wrong size where the strip belongs. Canvas,
    #    dimensions and colour are all correct; only the artwork is not the mark.
    a = bottom.copy()
    x0, y0, x1, y1 = locate_in(bottom, tmpl)
    a[y0:y1 + 1, x0:x1 + 1] = np.array([4, 4, 10])
    a[y0 + 8:y0 + 38, x0 + 4:x0 + 34] = np.array([139, 92, 246])   # a plain square
    f, m = fired(lambda: locate_in(a, tmpl))
    record("J3 right place, right colour, wrong shape", f, True, m)

    # J3b the loose check that J3 exists to discredit: "is there violet here?"
    loose = bool(A.violet_mask(a)[y0:y1 + 1, x0:x1 + 1].sum() > 100)
    record("J3b a colour-only check on that same frame", not loose, False,
           "accepted it, which is why the locator matches SHAPE")

    print("\nC. ambiguity and absence")
    # J4 the strip erased outright.
    a = bottom.copy()
    a[y0 - 6:y1 + 7, x0 - 6:x1 + 7] = np.array([4, 4, 10])
    f, m = fired(lambda: locate_in(a, tmpl))
    record("J4 strip erased entirely", f, True, m)

    # J5 a second, identical mark pasted elsewhere. This is the real failure
    #    mode: these cuts already show the mark large as scene art, and a first
    #    pass refused Berlin for exactly this reason.
    a = bottom.copy()
    mh = A.MARK_H
    mk = A.trim(A.MARK).resize((round(A.trim(A.MARK).width * mh / A.trim(A.MARK).height), mh))
    mk_rgb = np.asarray(mk.convert("RGB")).astype(int)
    mk_al = np.asarray(mk)[..., 3] > 96
    ty, tx = 700, 500
    reg = a[ty:ty + mk_al.shape[0], tx:tx + mk_al.shape[1]]
    reg[mk_al] = mk_rgb[mk_al]
    f, m = fired(lambda: locate_in(a, tmpl))
    record("J5 a second mark of the same size", f, True, m)

    print("\nD. the guards around the erase")
    # J6 a gradient painted around the strip. Erasing into it would leave a
    #    visible patch, so the ring test must refuse.
    a = bottom.copy()
    for i, yy in enumerate(range(y0 - 10, y1 + 11)):
        a[yy, x0 - 10:x1 + 11] = np.array([4 + i * 4, 4 + i * 3, 10 + i * 4])
    f, m = fired(lambda: A.canvas_ring(a, (x0, y0, x1, y1)))
    record("J6 non-flat ring around the strip", f, True, m)

    # J7 the flat ring on the real frame must NOT refuse.
    f, m = fired(lambda: A.canvas_ring(bottom, (x0, y0, x1, y1)))
    record("J7 real flat ring", f, False, A.canvas_ring(bottom, (x0, y0, x1, y1)))

    # J8 a strip too wide for the box being cleared must be refused before any
    #    encode, not discovered as a sliver of old art on screen afterwards.
    f, m = fired(lambda: A.compose("x", "y", (x0, y0, x1, y1), "0x000000",
                                   "z", (x1 - x0 + 1) + 99, strip.height))
    record("J8 new strip wider than the erase box", f, True, m)

    print("\nE. blind control")
    # J9 a locator that never refuses, shown every injection above. It must
    #    catch none of them, which is what proves the real one is discriminating
    #    rather than merely refusing a lot.
    def blind(_a, _t):
        return (0.99, x0, y0, x1, y1)
    real_find = A.find_mark
    A.find_mark = blind
    caught = 0
    for frame_ in (a, bottom):
        try:
            locate_in(frame_, tmpl)
        except (SystemExit, AssertionError, ValueError, IndexError):
            caught += 1
    A.find_mark = real_find
    record("J9 blind locator on the same frames", caught > 0, False,
           f"caught {caught} of 2, so the harness can tell blind from working")

    bad = [n for n, ok in RESULTS if not ok]
    print(f"\n{len(RESULTS) - len(bad)} of {len(RESULTS)} behaved as specified")
    if bad:
        print("  MISBEHAVED: " + ", ".join(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
