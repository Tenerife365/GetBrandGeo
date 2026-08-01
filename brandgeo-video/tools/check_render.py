"""
Render verifier for brandgeo-video.

Exit code 0 from a renderer is not evidence. A composition can render 100% of
its frames and be blank, be missing a layer, or put ink under a platform's UI
chrome. This measures the delivered file instead of trusting the process that
wrote it.

FOUR CHECKS, and each one has a negative control in negative_control.py that
proves it can go red. A checker that has never failed is not evidence either.

  probe        codec, dimensions, fps, frame count, duration, stream count
  blank        every sampled frame carries ink above a floor
  layer        declared regions each carry ink at the frames they are declared
  safe         all ink sits inside the package's declared box (vertical only)

The `layer` check is the one that catches a composition that renders but has
lost a band, which a whole-frame ink count cannot see: a frame that has lost
its bottom third still reports plenty of ink overall.

Ink is luminance above INK against a near-black canvas (#090A0F is luma ~10,
#0a0b0e is ~11). The floor is well clear of both and of the violet floor glow,
which peaks around 30 and must NOT be counted as ink or every check passes on
an otherwise empty frame. That is a real trap: the glow alone covers half the
canvas.

Usage:
    python tools/check_render.py                 # every declared target
    python tools/check_render.py P1EngineLadder  # one
"""

import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(ROOT, "out")
SCRATCH = os.path.join(OUT, "_frames")

# Luminance floor for "this pixel is ink". Above the violet floor glow (~30 at
# its brightest) and far above the canvas (~10).
INK = 45

# The box the package declares, from
# docs/growth/CAMPAIGN-2026-07-30/_shared/check_safe_zones.py, which reads it
# from bilingual/POSTS.md: the tightest of the four vertical platforms rather
# than any single one of them.
#
#     1080 x 1920,  200 px top,  360 px bottom,  200 px right
#
# so ink must sit inside x 0..879 and y 200..1559.
V_W, V_H = 1080, 1920
TOP, BOTTOM, RIGHT = 200, 360, 200
X_MAX = V_W - RIGHT - 1
Y_MIN, Y_MAX = TOP, V_H - BOTTOM - 1


# --------------------------------------------------------------------- probe

def probe(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format",
         "-of", "json", path],
        capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    v = [s for s in d["streams"] if s["codec_type"] == "video"]
    if not v:
        raise RuntimeError(f"{path}: no video stream")
    v = v[0]
    num, den = (v["r_frame_rate"].split("/") + ["1"])[:2]
    return {
        "codec": v["codec_name"],
        "pix_fmt": v.get("pix_fmt"),
        "width": int(v["width"]),
        "height": int(v["height"]),
        "fps": round(int(num) / int(den), 4),
        "frames": int(v.get("nb_frames") or 0),
        "duration": round(float(d["format"]["duration"]), 3),
        "streams": len(d["streams"]),
    }


def grab(path, frame_index, fps):
    """Extract one frame BY INDEX, not by wall-clock guess."""
    os.makedirs(SCRATCH, exist_ok=True)
    tag = os.path.splitext(os.path.basename(path))[0]
    png = os.path.join(SCRATCH, f"{tag}-f{frame_index:05d}.png")
    t = frame_index / fps
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.4f}", "-i", path,
         "-frames:v", "1", png],
        check=True)
    return png


def load(png):
    return np.asarray(Image.open(png).convert("RGB")).astype(int)


# --------------------------------------------------------------------- checks

def ink_mask(a):
    return a.mean(axis=2) > INK


def ink_stats(a):
    m = ink_mask(a)
    n = int(m.sum())
    if n == 0:
        return {"pixels": 0, "fraction": 0.0, "bbox": None}
    ys, xs = np.nonzero(m)
    return {
        "pixels": n,
        "fraction": round(n / m.size, 6),
        "bbox": (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())),
    }


def check_blank(a, floor_fraction):
    """A frame whose ink covers less than `floor_fraction` of the canvas is
    treated as blank. The floor is per-composition because a plain statement
    card legitimately carries far less ink than a grid of twenty tiles."""
    s = ink_stats(a)
    ok = s["fraction"] >= floor_fraction
    return ok, s


def check_regions(a, regions):
    """Each declared region must carry ink. This is what catches a lost layer.

    regions: list of (name, x0, y0, x1, y1, min_pixels)
    """
    out = []
    for name, x0, y0, x1, y1, floor in regions:
        sub = a[y0:y1, x0:x1]
        n = int(ink_mask(sub).sum())
        out.append({"region": name, "pixels": n, "floor": floor, "ok": n >= floor})
    return out


def check_safe(a):
    """Vertical masters only. Reports clearance, not a bare PASS, because a
    previous run of the sibling package passed by 0 and then breached by 163."""
    s = ink_stats(a)
    if s["bbox"] is None:
        return {"ok": False, "reason": "no ink at all", "bbox": None}
    x0, y0, x1, y1 = s["bbox"]
    return {
        "ok": (y0 >= Y_MIN) and (y1 <= Y_MAX) and (x1 <= X_MAX),
        "bbox": (x0, y0, x1, y1),
        "clear_top": y0 - Y_MIN,
        "clear_bottom": Y_MAX - y1,
        "clear_right": X_MAX - x1,
    }


# ---------------------------------------------------------------- the targets

def band(name, y0, y1, floor=400, x0=0, x1=None, w=V_W):
    return (name, x0, y0, x1 if x1 is not None else w, y1, floor)


# Sample frames are chosen at beats the composition is SUPPOSED to be doing
# something at, not at even intervals. An even sample can land entirely in the
# hold of a slow card and report a clean bill on a broken one.
TARGETS = {
    "P1EngineLadder": {
        "vertical": True,
        "expect": {"width": 1080, "height": 1920, "fps": 30.0, "frames": 405},
        "floor": 0.010,
        # Frame 60 legitimately carries only the title and the first rung, so a
        # settled-frame floor would fail a correct render. Lowering a floor to
        # make a test pass is usually the wrong move; it is right here only
        # because the region check below still asserts the title is present, so
        # a genuinely empty frame 60 is still caught.
        "floors": {60: 0.002},
        "frames": {
            60:  [band("title", 240, 320, 200)],
            250: [band("ladder", 300, 1060, 20000)],
            300: [band("ladder", 300, 1060, 20000),
                  band("stamp", 1060, 1200, 1500)],
            395: [band("ladder", 300, 1060, 20000),
                  band("stamp", 1060, 1200, 1500),
                  band("standard", 1200, 1330, 800)],
        },
    },
    "P2ConsensusSplit": {
        "vertical": True,
        "expect": {"width": 1080, "height": 1920, "fps": 30.0, "frames": 420},
        "floor": 0.008,
        # Re-declared 2026-07-31 after the layout fix: the grid moved down 80px
        # to clear the new source stamp, and the grid now hands the frame to the
        # closing figure instead of sharing it. Frame 415 asserts the grid is
        # GONE as well as that the figure is present, because "both on screen"
        # was the defect.
        "floors": {40: 0.004},
        "frames": {
            40:  [band("headline", 260, 470, 1500)],
            200: [band("headline", 260, 470, 1500),
                  band("headers", 470, 545, 300)],
            300: [band("grid", 545, 1100, 6000)],
            415: [band("overlap", 950, 1260, 2000)],
        },
        # Regions that must be EMPTY at a given frame. A presence-only checker
        # cannot see a layer that failed to leave.
        # 545..950 only. The closing figure legitimately occupies 966..1208
        # once the grid has gone, so a band reaching 1100 asserted the figure
        # was absent, which is the opposite of what this card should do.
        "empty": {415: [band("grid cleared", 545, 950, 0)]},
    },
    "P3RankOrNull": {
        "vertical": True,
        "expect": {"width": 1080, "height": 1920, "fps": 30.0, "frames": 390},
        "floor": 0.008,
        "frames": {
            100: [band("sourceline", 270, 420, 1200),
                  band("bignumber", 480, 760, 6000)],
            200: [band("bignumber", 480, 760, 4000)],
            340: [band("signals", 780, 1050, 3000),
                  band("phrases", 1050, 1250, 2000)],
            385: [band("assertions", 1150, 1400, 1500)],
        },
    },
    "P4DisclosedGap": {
        "vertical": True,
        "expect": {"width": 1080, "height": 1920, "fps": 30.0, "frames": 450},
        "floor": 0.008,
        "frames": {
            60:  [band("chips", 270, 380, 1200)],
            160: [band("counter", 400, 700, 5000)],
            320: [band("counter", 400, 700, 5000),
                  band("deductions", 700, 1000, 3000)],
            445: [band("doi", 1100, 1400, 800)],
        },
    },
}

# Long-form cards. 1920x1080, so the vertical safe box does not apply and the
# only geometric constraint is card 25's end-screen band, checked separately.
LF = [
    ("LF-01-cold-open", 210, 0.006, {0: [("headline", 200, 420, 1720, 660, 6000)]}),
    ("LF-02-columns-a", 210, 0.005, {120: [("columns", 300, 380, 1620, 700, 8000)]}),
    ("LF-03-columns-a-dated", 210, 0.005,
     {150: [("columns", 300, 380, 1620, 700, 8000),
            ("datestamp", 80, 970, 1200, 1040, 700)]}),
    ("LF-04-columns-b", 270, 0.010, {200: [("both", 120, 350, 1800, 720, 12000)]}),
    ("LF-05-columns-both", 300, 0.010,
     {200: [("both", 120, 350, 1800, 720, 12000),
            ("datestamp", 80, 970, 1300, 1040, 700)]}),
    ("LF-06-answer-travel", 360, 0.002, {60: [("stage", 200, 400, 1750, 620, 1500)]}),
    ("LF-07-empty-analytics", 300, 0.003,
     {60: [("stage", 200, 400, 1750, 620, 1500),
           ("panel", 740, 730, 1180, 960, 300)]}),
    ("LF-08-answer-is-product", 300, 0.004,
     {200: [("headline", 200, 280, 1720, 420, 4000),
            ("panel", 740, 600, 1180, 830, 300)]}),
    ("LF-09-logo-reveal", 240, 0.002, {30: [("lockup", 700, 300, 1220, 780, 2000)]}),
    ("LF-10-seven-engines", 360, 0.006,
     {300: [("chips", 180, 380, 1740, 700, 6000),
            ("caption", 600, 620, 1320, 700, 700)]}),
    ("LF-11-two-google-surfaces", 360, 0.005,
     {200: [("chips", 500, 330, 1420, 470, 2000),
            ("note", 300, 520, 1620, 720, 3000)]}),
    ("LF-12-section-record", 240, 0.004, {120: [("headline", 200, 460, 1720, 640, 4000)]}),
    ("LF-13-bars-companies", 420, 0.010,
     {200: [("bars", 200, 420, 1740, 680, 9000),
            ("datestamp", 80, 970, 900, 1040, 400)]}),
    ("LF-14-bars-all-four", 360, 0.014, {200: [("bars", 200, 330, 1740, 780, 18000)]}),
    ("LF-15-converge-fragment", 360, 0.006, {200: [("overlay", 200, 400, 1720, 700, 6000)]}),
    ("LF-16-language-split", 420, 0.010,
     {200: [("left", 300, 300, 830, 790, 4000),
            ("right", 1090, 300, 1620, 790, 4000),
            ("datestamp", 80, 970, 1300, 1040, 700)]}),
    ("LF-17-language-counter", 300, 0.010,
     {200: [("columns", 300, 240, 1620, 740, 8000),
            ("counter", 400, 660, 1520, 760, 1500)]}),
    ("LF-18-not-a-reorder", 300, 0.008, {200: [("headline", 200, 400, 1720, 700, 5000)]}),
    ("LF-19-honest-limit", 360, 0.004, {150: [("body", 230, 380, 1700, 700, 4000)]}),
    ("LF-20-three-steps", 300, 0.006, {200: [("panels", 180, 370, 1740, 710, 6000)]}),
    ("LF-21-section-fairness", 240, 0.004, {120: [("headline", 200, 460, 1720, 640, 4000)]}),
    ("LF-22-no-promise", 360, 0.004, {200: [("headline", 200, 440, 1720, 660, 4000)]}),
    ("LF-23-snapshot", 360, 0.004, {200: [("headline", 200, 440, 1720, 660, 4000)]}),
    ("LF-24-engines-new", 600, 0.006,
     {200: [("solo", 360, 330, 1560, 750, 4000)],
      480: [("three", 180, 330, 1740, 750, 6000)]}),
    ("LF-25-end-card", 420, 0.006,
     {90: [("wordmark", 300, 250, 1620, 600, 5000)],
      300: [("wordmark", 300, 150, 1620, 560, 5000)]}),
]

for _id, _frames, _floor, _regions in LF:
    TARGETS[_id] = {
        "vertical": False,
        "expect": {"width": 1920, "height": 1080, "fps": 30.0, "frames": _frames},
        "floor": _floor,
        "frames": _regions,
    }

# The one geometric constraint on the long-form set.
#
# YouTube places end-screen cards over the bottom right and the lower third for
# the last 5 to 20 seconds. ASSETS.md puts them at 6:12, which is frame 180 of
# the 14-second end card, and warns that the wordmark gets covered otherwise.
# So from frame 180 onward nothing may sit below y=720 or right of x=1280.
#
# This is the horizontal equivalent of the vertical safe-area check, and it
# exists for the same reason: the breach is invisible in the delivered file and
# only appears once the platform draws its own UI on top.
TARGETS["LF-25-end-card"]["empty"] = {
    300: [
        ("end-screen lower band", 0, 720, 1920, 1080, 0),
        ("end-screen right band", 1280, 0, 1920, 1080, 0),
    ],
}


# ------------------------------------------------------------------- driver

def run(name, spec):
    path = os.path.join(OUT, f"{name}.mp4")
    if not os.path.exists(path):
        return {"name": name, "ok": False, "why": "not rendered"}

    p = probe(path)
    fails = []

    for k, v in spec["expect"].items():
        if p[k] != v:
            fails.append(f"probe {k}: expected {v}, got {p[k]}")

    frames_report = []
    for fi, regions in sorted(spec["frames"].items()):
        png = grab(path, fi, p["fps"])
        a = load(png)
        floor = spec.get("floors", {}).get(fi, spec["floor"])
        blank_ok, stats = check_blank(a, floor)
        if not blank_ok:
            fails.append(
                f"frame {fi}: blank, ink fraction {stats['fraction']} "
                f"below floor {floor}")
        regs = check_regions(a, regions)
        for r in regs:
            if not r["ok"]:
                fails.append(
                    f"frame {fi}: region '{r['region']}' has {r['pixels']} ink "
                    f"pixels, floor {r['floor']}")

        # Regions asserted EMPTY. The inverse of the layer check, and it catches
        # the opposite failure: a layer that should have cleared and did not.
        # `ename` and not `name`: the first version of this loop reused the
        # run(name, spec) parameter, so P2ConsensusSplit reported its failure
        # under the heading "grid cleared". A checker that misattributes a
        # failure sends somebody to the wrong file.
        for ename, ex0, ey0, ex1, ey1, ceiling in spec.get("empty", {}).get(fi, []):
            n = int(ink_mask(a[ey0:ey1, ex0:ex1]).sum())
            regs.append({"region": f"~{ename}", "pixels": n,
                         "floor": ceiling, "ok": n <= ceiling})
            if n > ceiling:
                fails.append(
                    f"frame {fi}: region '{ename}' should be empty but carries "
                    f"{n} ink pixels")
        entry = {"frame": fi, "png": png, "ink": stats, "regions": regs}
        if spec["vertical"]:
            safe = check_safe(a)
            entry["safe"] = safe
            if not safe["ok"]:
                fails.append(f"frame {fi}: safe area breached, bbox {safe['bbox']}")
        frames_report.append(entry)

    return {"name": name, "ok": not fails, "probe": p,
            "frames": frames_report, "fails": fails}


def main(argv):
    names = argv[1:] or list(TARGETS)
    results = [run(n, TARGETS[n]) for n in names]
    passed = 0
    for r in results:
        if r.get("why"):
            print(f"MISSING  {r['name']}: {r['why']}")
            continue
        p = r["probe"]
        head = "PASS " if r["ok"] else "FAIL "
        passed += 1 if r["ok"] else 0
        print(f"{head}{r['name']:<28} {p['codec']} {p['width']}x{p['height']} "
              f"{p['fps']}fps {p['frames']}f {p['duration']}s "
              f"streams={p['streams']} pix={p['pix_fmt']}")
        for f in r["frames"]:
            bits = [f"    f{f['frame']:<5} ink {f['ink']['fraction']:.4f}"]
            if "safe" in f:
                s = f["safe"]
                bits.append(
                    f"bbox {s['bbox']} clear t/b/r "
                    f"{s['clear_top']}/{s['clear_bottom']}/{s['clear_right']}")
            bits.append(" ".join(
                f"{g['region']}={g['pixels']}{'' if g['ok'] else ' LOW'}"
                for g in f["regions"]))
            print("  ".join(bits))
        for m in r["fails"]:
            print(f"    !! {m}")
    print(f"\n{passed} of {len(results)} PASS")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
