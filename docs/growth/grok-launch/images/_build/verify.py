"""
Reads every produced file back off disk and checks the things that silently
ruin an asset: wrong dimensions, wrong container format, platform size floors
and ceilings, safe-area violations, and dash characters in any source file.

Safe-area check works on luminance. Text is #e8e9ed, which is ~233 in
greyscale; the violet artwork peaks near 110 and its bloom lower still. So a
greyscale threshold of 200 isolates type and the wordmark from the decoration,
and the bounding box of what survives is where the readable content actually
sits.
"""

import glob
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))

EXPECT = {
    "link-card-1200x630.png": (1200, 630, "PNG"),
    "bg-020-hero.png": (1600, 900, "PNG"),
    "instagram-portrait-1080x1350.jpg": (1080, 1350, "JPEG"),
    "instagram-square-1080x1080.jpg": (1080, 1080, "JPEG"),
    "facebook-feed-1440x1800.png": (1440, 1800, "PNG"),
    "x-post-1600x900.png": (1600, 900, "PNG"),
    "tiktok-cover-1080x1920.jpg": (1080, 1920, "JPEG"),
    "youtube-thumbnail-1920x1080.png": (1920, 1080, "PNG"),
    "youtube-banner-2560x1440.png": (2560, 1440, "PNG"),
    "x-header-1500x500.png": (1500, 500, "PNG"),
    "facebook-cover-1640x624.png": (1640, 624, "PNG"),
    "linkedin-cover-company-1128x191.png": (1128, 191, "PNG"),
    "linkedin-cover-personal-1584x396.png": (1584, 396, "PNG"),
}

fails = []


def ink_bbox(path, thresh=200):
    a = np.asarray(Image.open(path).convert("L"))
    ys, xs = np.where(a > thresh)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def main():
    print(f"{'file':<40} {'pixels':>12} {'fmt':>5} {'size':>11}   check")
    print("-" * 92)
    for name, (ew, eh, efmt) in EXPECT.items():
        p = os.path.join(OUT, name)
        if not os.path.exists(p):
            fails.append(f"{name}: MISSING")
            print(f"{name:<40} {'':>12} {'':>5} {'':>11}   MISSING")
            continue
        im = Image.open(p)
        kb = os.path.getsize(p) / 1024
        notes = []
        if (im.width, im.height) != (ew, eh):
            fails.append(f"{name}: {im.width}x{im.height}, expected {ew}x{eh}")
            notes.append("WRONG SIZE")
        if im.format != efmt:
            fails.append(f"{name}: format {im.format}, expected {efmt}")
            notes.append("WRONG FORMAT")
        if name.startswith("instagram") and im.format != "JPEG":
            fails.append(f"{name}: Instagram accepts JPEG only")
        if name == "youtube-thumbnail-1920x1080.png" and kb > 2048:
            fails.append(f"{name}: {kb:.0f} KB exceeds YouTube's 2 MB thumbnail cap")
            notes.append("OVER 2 MB")
        if kb < 10:
            fails.append(f"{name}: {kb:.1f} KB, under the 10 KB floor")
            notes.append("UNDER 10 KB")
        print(f"{name:<40} {im.width}x{im.height:<6} {im.format:>5} {kb:>8.1f} KB   "
              f"{' '.join(notes) if notes else 'ok'}")

    print("\nsafe areas, measured from the rendered pixels:")

    # YouTube: 1235x338 at the 2048x1152 minimum scales to 1544x423 centred on a
    # 2560x1440 upload, so x 508 to 2052 and y 508 to 931.
    bb = ink_bbox(os.path.join(OUT, "youtube-banner-2560x1440.png"))
    x0, y0, x1, y1 = 508, 508, 2052, 931
    ok = bb and x0 <= bb[0] and bb[1] >= y0 and bb[2] <= x1 and bb[3] <= y1
    print(f"  youtube banner   readable content {bb}")
    print(f"                   safe rect        ({x0}, {y0}, {x1}, {y1})   "
          f"{'INSIDE' if ok else 'OUTSIDE'}")
    if not ok:
        fails.append("youtube banner: readable content leaves the 1544x423 safe rect")

    # TikTok cover: Meta's usable band on a 9:16 master is y 269 to 1248, and
    # TikTok's grid takes a 1:1 centre crop, y 420 to 1500. Content must clear
    # both at once.
    bb = ink_bbox(os.path.join(OUT, "tiktok-cover-1080x1920.jpg"))
    lo, hi = 420, 1248
    ok = bb and bb[1] >= lo and bb[3] <= hi
    print(f"  tiktok cover     readable content {bb}")
    print(f"                   usable band      y {lo} to {hi}                "
          f"{'INSIDE' if ok else 'OUTSIDE'}")
    if not ok:
        fails.append("tiktok cover: content outside the grid crop / usable band overlap")

    # Dashes. None of these may appear in on-image text or in any file written
    # for this package.
    print("\ndash scan:")
    bad = []
    for p in glob.glob(os.path.join(HERE, "*.py")):
        src = open(p, encoding="utf-8").read()
        # Referenced by codepoint, otherwise this scanner trips over itself.
        for ch, label in ((chr(0x2013), "en dash"), (chr(0x2014), "em dash"),
                          (chr(0x2012), "figure dash"), (chr(0x2015), "horizontal bar")):
            if ch in src:
                bad.append(f"{os.path.basename(p)}: {label}")
    print("  " + ("; ".join(bad) if bad else "no en dash or em dash in any source file"))
    fails.extend(bad)

    print()
    if fails:
        print(f"FAILED, {len(fails)} problem(s):")
        for f in fails:
            print("  " + f)
    else:
        print("all checks passed")


if __name__ == "__main__":
    main()
