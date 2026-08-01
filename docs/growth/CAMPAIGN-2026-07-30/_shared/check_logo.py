"""
Looks at PIXELS for the retired logo. Not at filenames, not at exit codes.

Why a pixel test and not a file check
-------------------------------------
A check that only asks "does the logo file exist" passes happily while the
wrong art sits inside it. This project has already shipped a check that passed
a wrong ENGINE NAME because all it could do was count engines. So this counts
colours that only the retired art can produce.

The retired mark is a blue-to-violet `b` with a dark navy centre, and its
wordmark sets GEO in a blue-to-violet ramp. Both put saturated BLUE on screen:
low red, high blue, blue well clear of green. The live v3 palette never does.
Measured, not assumed:

    #6366F1 (99,102,241)   v3 gradient start   -> not signature
    #8B5CF6 (139,92,246)   v3 primary          -> not signature
    #7C3AED (124,58,237)   v3 gradient end     -> not signature
    #A78BFA (167,139,250)  v3 GEO ramp end     -> not signature
    #E8E9ED (232,233,237)  wordmark "Brand"    -> not signature

and the retired lockup lights up 16,957 pixels of its own 52,158 opaque ones.

So a non-zero count is the retired art, and zero is consistent with the live
art. The second half of that sentence is weak on its own, which is why
`assert_mark_present` exists too: it demands the violet actually be there, so
an all-black file cannot pass by having nothing in it.

Usage
    python check_logo.py [--json] [paths ...]
Defaults to the whole campaign package.
"""

import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(HERE, ".."))

# Retired art: saturated blue. Three conditions, and the third is the one that
# does the real work.
#
# Red low and blue high alone was not enough. It caught one pixel per frame in
# every YouTube Short at (224,1420), colour (65,46,173), which is the live
# violet #7C3AED dimmed by an antialiased edge, not the retired logo. The fix is
# structural rather than a threshold nudge: on the retired blue ramp GREEN sits
# well above RED, e.g. (22,90,240). On the whole v3 violet ramp red is at or
# above green, e.g. #7C3AED (124,58,237), #8B5CF6 (139,92,246), and even the
# blue-most stop #6366F1 (99,102,241) only reaches g-r = 3. So requiring green
# to clear red by 25 separates the two ramps by their shape, not by brightness,
# and no amount of dimming or JPEG ringing can move a violet pixel across it.
SIG_R_MAX = 70
SIG_B_MIN = 170
SIG_BG_MIN = 80
SIG_GR_MIN = 25

# Live art: the violet ramp. Any of these hues counts as the mark being present.
VIOLET_R = (90, 200)
VIOLET_B_MIN = 200
VIOLET_BR_MIN = 40          # blue clear of red
VIOLET_RG_MIN = 15          # red clear of green, which is what makes it violet
                            # rather than blue

VIDEO_SAMPLES = (0.05, 0.25, 0.45, 0.65, 0.85)


def _rgb(im):
    a = np.asarray(im.convert("RGBA")).astype(np.int16)
    return a[..., 0], a[..., 1], a[..., 2], a[..., 3]


def retired_px(im):
    """Count pixels only the retired art can produce."""
    r, g, b, al = _rgb(im)
    m = al > 200
    hit = ((r < SIG_R_MAX) & (b > SIG_B_MIN) & (b - g > SIG_BG_MIN)
           & (g - r > SIG_GR_MIN) & m)
    return int(hit.sum())


def violet_px(im):
    """Count pixels on the live violet ramp."""
    r, g, b, al = _rgb(im)
    m = al > 200
    hit = ((r >= VIOLET_R[0]) & (r <= VIOLET_R[1]) & (b > VIOLET_B_MIN)
           & (b - r > VIOLET_BR_MIN) & (r - g > VIOLET_RG_MIN) & m)
    return int(hit.sum())


def scan_image(path):
    im = Image.open(path)
    return {"retired": retired_px(im), "violet": violet_px(im), "kind": "image"}


def _frame(path, t, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", path,
                    "-frames:v", "1", out], check=True)
    return Image.open(out)


def _duration(path):
    o = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True).stdout.strip()
    return float(o)


def scan_video(path, scratch):
    dur = _duration(path)
    tmp = os.path.join(scratch, "_probe.png")
    worst, tot, vio = 0, 0, 0
    for f in VIDEO_SAMPLES:
        im = _frame(path, dur * f, tmp)
        n = retired_px(im)
        worst = max(worst, n)
        tot += n
        vio = max(vio, violet_px(im))
    return {"retired": worst, "retired_sum": tot, "violet": vio,
            "kind": "video", "frames": len(VIDEO_SAMPLES)}


def walk(paths):
    out = []
    for p in paths:
        if os.path.isfile(p):
            out.append(p)
            continue
        for root, _, files in os.walk(p):
            if "__pycache__" in root:
                continue
            for f in sorted(files):
                if f.lower().endswith((".png", ".jpg", ".jpeg", ".mp4")):
                    out.append(os.path.join(root, f))
    return sorted(out)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    as_json = "--json" in sys.argv
    scratch = os.environ.get("SCRATCH", ".")
    os.makedirs(scratch, exist_ok=True)

    targets = walk(args or [PKG])
    rows, bad = [], []
    for p in targets:
        rel = os.path.relpath(p, PKG).replace("\\", "/")
        r = scan_video(p, scratch) if p.lower().endswith(".mp4") else scan_image(p)
        r["file"] = rel
        rows.append(r)
        if r["retired"] > 0:
            bad.append(r)

    if as_json:
        print(json.dumps(rows, indent=1))
    else:
        print(f"scanned {len(rows)} files  "
              f"({sum(1 for r in rows if r['kind'] == 'video')} video, "
              f"{sum(1 for r in rows if r['kind'] == 'image')} image)")
        print(f"CARRY RETIRED LOGO: {len(bad)}")
        for r in sorted(bad, key=lambda x: -x["retired"]):
            print(f"  {r['retired']:>7} px  {r['file']}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
