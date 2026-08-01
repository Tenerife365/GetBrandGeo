"""
Measures the bilingual lockup against the reserves the package declares.

`bilingual/POSTS.md` states the binding box, which is the tightest of the four
platforms rather than any single one of them:

    1080 x 1920,  200 px top,  360 px bottom,  200 px right

so ink must sit inside x 0..879 and y 200..1559.

Two numbers are reported per file, and both matter:

  LOCKUP   the ink of the brand strip alone, isolated by the violet the strip
           uses and the light grey of the wordmark. This is the thing that just
           changed, so it is the thing under test.
  FRAME    every ink pixel in the frame. Reported so a lockup that passes inside
           a cut whose copy already breaches cannot read as a clean bill.

A previous run of this package put ink 163 px into Instagram's bottom reserve
and 114 px into the right, so a pass here is stated with its clearance rather
than as a bare PASS.

Run: python check_safe_zones.py [file-or-dir ...]
"""

import glob
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))

W, H = 1080, 1920
TOP, BOTTOM, RIGHT = 200, 360, 200
X_MAX = W - RIGHT - 1                  # 879
Y_MIN, Y_MAX = TOP, H - BOTTOM - 1     # 200 .. 1559

SAMPLES = (0.02, 0.2, 0.4, 0.6, 0.8, 0.98)
INK = 45
SCRATCH = os.environ.get("SCRATCH", ".")


def frame(path, t, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", path,
                    "-frames:v", "1", out], check=True)
    return np.asarray(Image.open(out).convert("RGB")).astype(int)


def duration(path):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip())


STRIP_H = 46            # add_lockup.py's MARK_H, which sets the strip height


def _strip_w():
    """The strip's width, BUILT rather than remembered.

    This was `STRIP_W = 202`, a number measured once by hand. It went stale the
    moment the wordmark was reset from Inter to Geist on 2026-07-31: Geist's ink
    is 80px tall against Inter's 82 for the same 512px width, so at WORD_H=24 the
    wordmark widens from 150px to 154px and the strip from 202 to 206. The old
    constant survived only because the tolerance below is +/-12, which is luck,
    not a check. Asking `add_lockup.py` to build the strip removes the constant
    and the luck together.
    """
    import add_lockup
    return add_lockup.build_strip().width


STRIP_W = _strip_w()


def violet_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 90) & (r < 210) & (b > 190) & (b - r > 40) & (r - g > 15)


def find_strip(a):
    """Isolate the brand strip, not merely 'anything violet'.

    Colour alone does not identify it: these cuts set body copy in the same
    violet and headlines in the same near-white, which is why a first pass here
    reported a LOCKUP box 700px wide. The strip is found by SHAPE instead. It is
    the only contiguous ink run in the left margin that is STRIP_H tall and
    carries both violet and near-white inside a STRIP_W-wide window.
    """
    lum = a.mean(axis=2)
    ink = lum > INK
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pale = (r > 180) & (g > 180) & (b > 180)
    vio = violet_mask(a)

    # Drop the left rail before looking for row runs. Paris runs a violet
    # progress rail six pixels wide down the left margin, and it overlaps the
    # strip's rows, so a run detected across the raw column window swallows both
    # and comes out 120px tall instead of 46. The rail is the leftmost column
    # group and it is narrow; the strip's mark is not. Cut any leading group
    # under 20px wide rather than picking an x cutoff by hand, so this holds for
    # a city whose rail sits somewhere else.
    win = ink[:, :520]
    colprof = win.any(axis=0)
    cut = 0
    idx = np.nonzero(colprof)[0]
    if len(idx):
        first = idx[0]
        end = first
        while end + 1 < len(colprof) and colprof[end + 1]:
            end += 1
        if end - first + 1 < 20:
            cut = end + 1
    rows = win[:, cut:].any(axis=1)
    runs, start = [], None
    for i, v in enumerate(rows):
        if v and start is None:
            start = i
        if not v and start is not None:
            runs.append((start, i - 1)); start = None
    if start is not None:
        runs.append((start, len(rows) - 1))

    for y0, y1 in runs:
        if not (STRIP_H - 3 <= y1 - y0 + 1 <= STRIP_H + 3):
            continue
        band = ink[y0:y1 + 1, cut:]
        cols = np.nonzero(band.any(axis=0))[0] + cut
        if len(cols) == 0:
            continue
        x0, x1 = int(cols.min()), int(cols.max())
        if not (STRIP_W - 12 <= x1 - x0 + 1 <= STRIP_W + 12):
            continue
        sub = (slice(y0, y1 + 1), slice(x0, x1 + 1))
        if vio[sub].sum() < 80 or pale[sub].sum() < 80:
            continue
        return x0, y0, x1, y1
    return None


def box(mask):
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def report(path):
    d = duration(path)
    tmp = os.path.join(SCRATCH, "_sz.png")
    frame_box = None
    lock_box = None
    for f in SAMPLES:
        a = frame(path, d * f, tmp)
        assert a.shape[:2] == (H, W), f"{path}: {a.shape[1]}x{a.shape[0]}, not {W}x{H}"
        lum = a.mean(axis=2)
        b1 = box(lum > INK)
        b2 = find_strip(a)
        for cur, new in (("frame", b1), ("lock", b2)):
            if new is None:
                continue
            if cur == "frame":
                frame_box = new if frame_box is None else (
                    min(frame_box[0], new[0]), min(frame_box[1], new[1]),
                    max(frame_box[2], new[2]), max(frame_box[3], new[3]))
            else:
                lock_box = new if lock_box is None else (
                    min(lock_box[0], new[0]), min(lock_box[1], new[1]),
                    max(lock_box[2], new[2]), max(lock_box[3], new[3]))
    assert lock_box is not None, f"{path}: brand strip not found in any sampled frame"
    return frame_box, lock_box


def judge(b):
    if b is None:
        return "no ink", True
    x0, y0, x1, y1 = b
    over = []
    if y0 < Y_MIN:
        over.append(f"top by {Y_MIN - y0}")
    if y1 > Y_MAX:
        over.append(f"bottom by {y1 - Y_MAX}")
    if x1 > X_MAX:
        over.append(f"right by {x1 - X_MAX}")
    if over:
        return "BREACH " + ", ".join(over), False
    return (f"clear: top +{y0 - Y_MIN}, bottom +{Y_MAX - y1}, right +{X_MAX - x1}",
            True)


def main():
    os.makedirs(SCRATCH, exist_ok=True)
    args = sys.argv[1:]
    files = []
    for a in args or [os.path.join(PKG, "bilingual")]:
        files += sorted(glob.glob(os.path.join(a, "**", "*.mp4"), recursive=True)) \
            if os.path.isdir(a) else [a]
    files = [f for f in files if f.endswith("-silent.mp4")] or files

    print(f"box: x 0..{X_MAX}, y {Y_MIN}..{Y_MAX}  "
          f"(top {TOP}, bottom {BOTTOM}, right {RIGHT} of {W}x{H})\n")
    ok = True
    for f in files:
        fb, lb = report(f)
        vf, okf = judge(fb)
        vl, okl = judge(lb)
        ok = ok and okf and okl
        print(f"{os.path.relpath(f, PKG).replace(chr(92), '/')}")
        print(f"   LOCKUP {str(lb):<28} {vl}")
        print(f"   FRAME  {str(fb):<28} {vf}")
    print("\nPASS" if ok else "\nFAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
