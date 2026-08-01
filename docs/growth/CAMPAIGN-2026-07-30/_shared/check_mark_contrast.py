"""
Measures the mark against whatever background it actually landed on.

Why this is not a formality. The retired mark was a filled shape: a coloured `b`
with a WHITE ring and a dark navy disc inside the counter. It carried its own
light and dark, so it held up on almost anything. The v3 mark is a monoline
stroke with a genuinely transparent counter, so the background shows straight
through the hole and the only contrast it has is violet against whatever is
behind it. Swapping one for the other can change legibility even though nothing
about the layout moved.

Two numbers per file, both WCAG contrast ratios:

  INK vs BG      the violet stroke against the local background. WCAG 1.4.11
                 wants 3:1 for a graphical object, so 3.0 is the floor.
  COUNTER vs INK the hole against the stroke around it. If a background ever
                 came close to the violet, the counter would fill in and the
                 mark would read as a solid blob rather than a `b`.

The background is sampled from the ring immediately around the mark rather than
from the design token, because these canvases carry vignettes and gradients and
the token is not what the eye sees.

Run: python check_mark_contrast.py [file ...]
"""

import glob
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))
FLOOR = 3.0
SCRATCH = os.environ.get("SCRATCH", ".")


def lum(c):
    o = []
    for v in c[:3]:
        v = v / 255.0
        o.append(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def violet(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 90) & (r < 215) & (b > 190) & (b - r > 40) & (r - g > 15)


def measure(a):
    """Find the mark, then measure it against its own surroundings."""
    m = violet(a)
    if m.sum() < 200:
        return None
    ys, xs = np.nonzero(m)
    # The mark is the violet cluster nearest the top-left corner of the ink,
    # which is where every layout in this package puts the lockup.
    y0, x0 = int(ys.min()), int(xs[ys < ys.min() + 260].min())
    h = min(260, a.shape[0] - y0)
    w = min(260, a.shape[1] - x0)
    win = a[y0:y0 + h, x0:x0 + w]
    wm = violet(win)
    if wm.sum() < 200:
        return None

    ink = win[wm].mean(axis=0)

    pad = 10
    ry0 = max(0, y0 - pad)
    ring = np.concatenate([
        a[ry0:y0, max(0, x0 - pad):x0 + w].reshape(-1, 3),
        a[y0:y0 + h, max(0, x0 - pad):x0].reshape(-1, 3),
    ]) if y0 > 0 else a[y0:y0 + h, max(0, x0 - pad):x0].reshape(-1, 3)
    bg = ring.mean(axis=0) if len(ring) else np.array([10, 11, 14])

    # The counter: non-violet pixels enclosed by the mark's own bounding box.
    ys2, xs2 = np.nonzero(wm)
    mb = win[ys2.min():ys2.max() + 1, xs2.min():xs2.max() + 1]
    mbm = violet(mb)
    hole = mb[~mbm]
    counter = hole.mean(axis=0) if len(hole) else bg

    return dict(ink=ink, bg=bg, counter=counter,
                ink_bg=ratio(ink, bg), counter_ink=ratio(counter, ink))


def load(path):
    if path.lower().endswith(".mp4"):
        d = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", path], capture_output=True, text=True).stdout)
        out = os.path.join(SCRATCH, "_mc.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{d * 0.5:.3f}",
                        "-i", path, "-frames:v", "1", out], check=True)
        path = out
    return np.asarray(Image.open(path).convert("RGB")).astype(float)


def main():
    os.makedirs(SCRATCH, exist_ok=True)
    targets = sys.argv[1:]
    if not targets:
        targets = []
        for pat in ("x/images/*.png", "threads/images/*.png", "linkedin/feed/*.png",
                    "linkedin/carousel/*.png", "facebook/feed/*.png",
                    "facebook/link/*.png", "instagram/feed/*.png",
                    "instagram/stories/*.png", "google-business-profile/*.png",
                    "youtube/thumbnails/*.png", "product/*.png",
                    "bilingual/*/*-silent.mp4"):
            targets += sorted(glob.glob(os.path.join(PKG, pat)))

    print(f"{'file':<58} {'ink vs bg':>10} {'counter vs ink':>15}")
    worst, fails, skipped = 99.0, [], 0
    for t in targets:
        r = measure(load(t))
        rel = os.path.relpath(t, PKG).replace("\\", "/")
        if r is None:
            skipped += 1
            continue
        worst = min(worst, r["ink_bg"])
        flag = "" if r["ink_bg"] >= FLOOR else "   BELOW 3:1"
        if r["ink_bg"] < FLOOR:
            fails.append((rel, r["ink_bg"]))
        print(f"{rel:<58} {r['ink_bg']:>9.2f}:1 {r['counter_ink']:>14.2f}:1{flag}")

    print(f"\n{len(targets) - skipped} measured, {skipped} carried no mark to measure")
    print(f"lowest ink-vs-background ratio: {worst:.2f}:1   floor {FLOOR}:1")
    print("PASS" if not fails else f"FAIL, {len(fails)} below the floor")
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
