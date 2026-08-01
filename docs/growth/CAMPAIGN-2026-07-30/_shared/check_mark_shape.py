"""
Checks the mark by its SILHOUETTE, because colour alone is not identity.

`check_logo.py` counts pixels only the retired blue ramp can produce, and it is
decisive against the retired art as it actually exists. It has one blind spot,
and it is not hypothetical: a retired mark RECOLOURED to the v3 violet passes
every colour test ever written for this package. Wrong shape, right hue, silent.

So this asks a different question. It finds the mark in each delivered image and
compares its silhouette against the v3 mark's own alpha mask, scored by
intersection over union. Shape is what the two marks do not share: the retired
mark is a blue-to-violet `b` with a teardrop base and a filled disc in the
counter, the v3 mark is a flat monoline `b` with the counter punched through.

Measured on this package
------------------------
    delivered statics        0.92 to 0.94
    the retired mark         0.63, injected deliberately, see the control below

The threshold sits at 0.85, in the empty gap between those two, not next to
either. The scores do not reach 1.0 because the candidate is recovered from
rendered pixels, at whatever size the layout drew it, then compared against the
template resized to that same box, so antialiasing and downsampling cost a few
points on every honest match.

How the mark is found, and why it is scale-free
-----------------------------------------------
Violet pixels are grouped into connected components and each component is scored
against the template resized to that component's own bounding box. Nothing here
knows how large the mark was drawn, so one code path covers a 1200x900 GBP card
and a 1600x900 X image without being told the difference. The GEO letterforms in
the wordmark are violet too and become candidates as well; they score far below
the mark, so the BEST score in the image is the mark's. That is what is
asserted.

This does not replace `check_logo.py`. Colour catches a retired mark that was
never recoloured, which is the common case; shape catches one that was. Run
both.

Run: python check_mark_shape.py [paths ...]
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))
LOGO = os.path.join(HERE, "logo")
RETIRED = os.path.join(LOGO, "_retired-2026-07-30")

sys.path.insert(0, HERE)
import add_lockup as A                                          # noqa: E402

FLOOR = 0.85
MIN_W, MIN_H, MIN_PX = 12, 15, 200

# What is ASSERTED: images a renderer in this package produced, which the brief
# requires to carry the lockup.
ASSERT_DIRS = (
    "facebook/feed", "facebook/link",
    "instagram/feed", "instagram/stories",
    "linkedin/feed", "linkedin/carousel",
    "x/images", "threads/images",
    "google-business-profile", "product",
    "youtube/thumbnails",
    "bilingual",
)

# What is REPORTED but not asserted: cover frames extracted from the reel cuts.
#
# A cover is frame 0 of a video, so it carries whatever that frame carries, and
# these were produced by the reel pipeline rather than by a renderer here. Two
# things were found by looking at them, both PRE-EXISTING and both outside this
# package's static renders:
#
#   * the nine TikTok covers carry drawn `BRANDGEO` type in violet and no mark
#     at all, which is the pre-lockup state the bilingual cuts were rescued
#     from and the reel cuts never were,
#   * five of the nine YouTube Shorts covers are title cards with no brand
#     element in frame 0; the other four match a stray violet letterform out of
#     the body copy at 0.54 to 0.69.
#
# Asserting the floor over these would fail the run for something no renderer
# here controls, so they are measured, printed, and left to their owner.
REPORT_DIRS = ("facebook/video", "instagram/reels", "tiktok/video", "youtube/shorts")


def best_iou(a, tmpl):
    """Best silhouette match in the frame, and the box it was found in."""
    best = (0.0, None)
    for x0, y0, x1, y1, pts in A.components(A.violet_mask(a)):
        w, h = x1 - x0 + 1, y1 - y0 + 1
        if w < MIN_W or h < MIN_H or len(pts) < MIN_PX:
            continue
        cm = np.zeros((h, w), bool)
        for y, x in pts:
            cm[y - y0, x - x0] = True
        t = np.asarray(tmpl.resize((w, h), Image.LANCZOS))[..., 3] > 96
        s = float((t & cm).sum()) / max(1, int((t | cm).sum()))
        if s > best[0]:
            best = (s, (x0, y0, w, h))
    return best


def images(paths):
    out = []
    for p in paths:
        if os.path.isfile(p):
            out.append(p)
            continue
        for dp, _, fs in os.walk(p):
            for f in fs:
                if f.lower().endswith((".png", ".jpg", ".jpeg")):
                    out.append(os.path.join(dp, f))
    return sorted(out)


def sweep(paths, tmpl):
    scored, missing = [], []
    for p in paths:
        a = np.asarray(Image.open(p).convert("RGB")).astype(int)
        s, box = best_iou(a, tmpl)
        if box is None:
            missing.append(p)
        else:
            scored.append((s, p, box))
    scored.sort()
    return scored, missing


def main():
    args = sys.argv[1:]
    tmpl = A.trim(A.MARK)

    if args:
        assert_paths, report_paths = images(args), []
    else:
        assert_paths = images([os.path.join(PKG, *d.split("/")) for d in ASSERT_DIRS])
        report_paths = images([os.path.join(PKG, *d.split("/")) for d in REPORT_DIRS])

    scored, missing = sweep(assert_paths, tmpl)
    failed = [(s, p, b) for s, p, b in scored if s < FLOOR]

    print(f"ASSERTED, images this package renders.  floor {FLOOR}")
    print(f"  {len(scored)} carry a mark, {len(missing)} carry no violet candidate")
    if scored:
        print(f"  lowest  {scored[0][0]:.3f}  {os.path.relpath(scored[0][1], PKG)}")
        print(f"  highest {scored[-1][0]:.3f}  {os.path.relpath(scored[-1][1], PKG)}")
    for s, p, box in failed:
        print(f"  FAIL {s:.3f}  {os.path.relpath(p, PKG)}  at {box}")
    for p in missing:
        print(f"  NO MARK  {os.path.relpath(p, PKG)}")

    if report_paths:
        rs, rm = sweep(report_paths, tmpl)
        low = [(s, p) for s, p, _ in rs if s < FLOOR]
        print(f"\nREPORTED, cover frames from the reel cuts. Not asserted, see the "
              f"note in this file.")
        print(f"  {len(rs)} scored, {len(rm)} with no violet candidate, "
              f"{len(low)} below {FLOOR}")
        for s, p in low[:4]:
            print(f"    {s:.3f}  {os.path.relpath(p, PKG)}")
        if len(low) > 4:
            print(f"    ... and {len(low) - 4} more, all in the same two folders")
        for p in rm[:2]:
            print(f"    no candidate  {os.path.relpath(p, PKG)}")
        if len(rm) > 2:
            print(f"    ... and {len(rm) - 2} more")

    # ---- the control. Colour cannot tell these apart; shape must. ----------
    print("\nnegative control, the retired mark recoloured to v3 violet")
    ret = A.trim(os.path.join(RETIRED, "brandgeo-mark-transparent-h512.png"))
    ret = ret.resize((120, 154), Image.LANCZOS)
    al = np.asarray(ret)[..., 3] > 96
    canvas = np.full((400, 400, 3), (10, 11, 14), dtype=int)
    canvas[20:20 + al.shape[0], 20:20 + al.shape[1]][al] = (139, 92, 246)
    s_ret, _ = best_iou(canvas, tmpl)

    clean = np.full((400, 400, 3), (10, 11, 14), dtype=int)
    v3 = A.trim(A.MARK).resize((120, 154), Image.LANCZOS)
    al3 = np.asarray(v3)[..., 3] > 96
    clean[20:20 + al3.shape[0], 20:20 + al3.shape[1]][al3] = (139, 92, 246)
    s_v3, _ = best_iou(clean, tmpl)

    import check_logo as CL
    ret_col = CL.retired_px(Image.fromarray(canvas.astype(np.uint8)).convert("RGBA"))

    print(f"  retired silhouette, v3 hue   IoU {s_ret:.3f}  "
          f"{'FIRES' if s_ret < FLOOR else 'MISSED'}")
    print(f"  v3 silhouette, v3 hue        IoU {s_v3:.3f}  "
          f"{'quiet' if s_v3 >= FLOOR else 'FALSE POSITIVE'}")
    print(f"  the colour check on that same recoloured mark: {ret_col} px, "
          f"{'caught it' if ret_col else 'MISSED it, which is why shape is checked'}")

    ctrl_ok = (s_ret < FLOOR) and (s_v3 >= FLOOR)
    print(f"  control: {'2 of 2 behaved as specified' if ctrl_ok else 'CONTROL BROKEN'}")

    ok = not failed and not missing and ctrl_ok
    print("\nPASS" if ok else "\nFAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
