"""
Negative controls for every check in tools/.

A checker that has never gone red is not evidence. Each control below takes a
KNOWN-GOOD input, breaks it in one specific way, and asserts the corresponding
check reports the break. If a control does not go red, the check it guards is
worthless and this file exits non-zero.

Nothing here writes into out/ or into src/. Mutated copies go to
out/_nc/ and are read once and discarded.

  NC1  blank frame                 -> check_blank
  NC2  a layer removed             -> check_regions
  NC3  ink 1px inside bottom       -> check_safe
  NC4  ink 1px inside right        -> check_safe
  NC5  ink 1px inside top          -> check_safe
  NC6  Free's engine NAME wrong,   -> check_ladder
       count unchanged
  NC7  the Radar rung deleted      -> check_ladder
  NC8  a real engine name on a     -> check_ladder
       plan that does not carry it
  NC9  a rung that LOSES an engine -> check_ladder
  NC10 Inter absent                -> check_fonts

NC6 is the important one. It reproduces the exact defect that shipped: on
2026-07-31 Free moved from ChatGPT to Gemini and the engine COUNT did not
change. A checker that counts engines passes that mutation. This asserts ours
does not.

Usage: python tools/negative_control.py
"""

import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(ROOT, "out")
NC = os.path.join(OUT, "_nc")

sys.path.insert(0, HERE)
import check_render as cr  # noqa: E402
import check_fonts as cf  # noqa: E402

RESULTS = []


def record(name, went_red, detail):
    RESULTS.append((name, went_red, detail))
    mark = "ok  " if went_red else "BROKEN"
    print(f"{mark} {name:<52} {detail}")


def base_frame():
    """A real frame from a real render, used as the known-good input."""
    src = os.path.join(OUT, "P1EngineLadder.mp4")
    if not os.path.exists(src):
        raise SystemExit("render P1EngineLadder first")
    p = cr.probe(src)
    return cr.load(cr.grab(src, 395, p["fps"]))


def main():
    os.makedirs(NC, exist_ok=True)
    a = base_frame()

    # --- the known-good baseline must be GREEN, or every red below is a lie ---
    ok, stats = cr.check_blank(a, 0.010)
    record("BASELINE frame passes check_blank (must be green)", ok,
           f"ink fraction {stats['fraction']}")
    safe = cr.check_safe(a)
    record("BASELINE frame passes check_safe (must be green)", safe["ok"],
           f"bbox {safe['bbox']}")

    # --- NC1, a blank frame -------------------------------------------------
    blank = np.zeros_like(a)
    blank[:, :] = [9, 10, 15]          # the canvas colour, not pure black
    ok, stats = cr.check_blank(blank, 0.010)
    record("NC1 blank frame is caught by check_blank", not ok,
           f"ink fraction {stats['fraction']} vs floor 0.010")

    # a floor-glow-only frame is the subtler version of the same failure: it
    # is not black, so a naive 'is it all one colour' test passes it
    glow = np.zeros_like(a)
    glow[:, :] = [26, 18, 42]
    ok, stats = cr.check_blank(glow, 0.010)
    record("NC1b glow-only frame is caught by check_blank", not ok,
           f"ink fraction {stats['fraction']}, glow is below the ink floor")

    # --- NC2, a layer removed ----------------------------------------------
    regions = cr.TARGETS["P1EngineLadder"]["frames"][395]
    before = cr.check_regions(a, regions)
    missing = a.copy()
    # black out the standard line band, which is the closing layer
    missing[1200:1330, :] = [9, 10, 15]
    after = cr.check_regions(missing, regions)
    went_red = all(r["ok"] for r in before) and any(not r["ok"] for r in after)
    bad = [r["region"] for r in after if not r["ok"]]
    record("NC2 a removed layer is caught by check_regions", went_red,
           f"before all ok, after failed {bad}")

    # a whole-frame ink count does NOT catch it, which is why regions exist
    whole_ok, whole_stats = cr.check_blank(missing, 0.010)
    record("NC2b the same removal is INVISIBLE to a whole-frame count",
           whole_ok,
           f"still {whole_stats['fraction']} ink, so check_blank alone passes it")

    # --- NC3/4/5, one pixel inside each reserve ----------------------------
    for label, (y, x), key in (
        ("NC3 bottom reserve", (cr.Y_MAX + 1, 500), "bottom"),
        ("NC4 right reserve", (800, cr.X_MAX + 1), "right"),
        ("NC5 top reserve", (cr.Y_MIN - 1, 500), "top"),
    ):
        one = a.copy()
        one[y, x] = [255, 255, 255]
        s = cr.check_safe(one)
        record(f"{label}: 1px at ({x},{y}) is caught by check_safe",
               not s["ok"], f"bbox {s['bbox']}")

    # --- NC6..NC9, the ladder data check -----------------------------------
    p1 = os.path.join(ROOT, "src", "P1EngineLadder.tsx")
    src = open(p1, encoding="utf-8").read()

    def ladder(tag, mutated, why):
        path = os.path.join(NC, f"P1-{tag}.tsx")
        with open(path, "w", encoding="utf-8") as f:
            f.write(mutated)
        r = subprocess.run([sys.executable, os.path.join(HERE, "check_ladder.py"), path],
                           capture_output=True, text=True)
        record(f"{tag} {why}", r.returncode != 0,
               f"check_ladder exit {r.returncode}")
        return r

    # the real file must pass, or the mutations prove nothing
    r = subprocess.run([sys.executable, os.path.join(HERE, "check_ladder.py")],
                       capture_output=True, text=True)
    record("BASELINE check_ladder passes on the real file (must be green)",
           r.returncode == 0, f"exit {r.returncode}")

    # NC6: the exact defect that shipped. Name wrong, COUNT UNCHANGED.
    m = src.replace("{ plan: 'Free', engineCount: 1, adds: 'Gemini' }",
                    "{ plan: 'Free', engineCount: 1, adds: 'ChatGPT' }")
    assert m != src, "NC6 mutation did not apply"
    ladder("NC6", m, "wrong engine NAME on Free, count still 1, is caught")

    # NC7: the second defect that shipped, a whole rung missing
    m = src.replace("    { plan: 'Radar', engineCount: 2, adds: 'plus Claude' },\n", "")
    assert m != src, "NC7 mutation did not apply"
    ladder("NC7", m, "the Radar rung deleted is caught")

    # NC8: a real engine label, on a plan that does not carry it
    m = src.replace("adds: 'plus Perplexity, Google AI Mode'",
                    "adds: 'plus Perplexity, Grok'")
    assert m != src, "NC8 mutation did not apply"
    ladder("NC8", m, "a real engine named on a plan without it is caught")

    # NC9: an inversion, a rung that carries fewer engines than the one below
    m = src.replace("{ plan: 'Radar', engineCount: 2, adds: 'plus Claude' }",
                    "{ plan: 'Radar', engineCount: 2, adds: 'plus ChatGPT' }")
    assert m != src, "NC9 mutation did not apply"
    ladder("NC9", m, "a rung naming an engine it does not carry is caught")

    # --- NC10, the font check ----------------------------------------------
    probe = os.path.join(OUT, "FontProbe.png")
    if os.path.exists(probe):
        img = np.asarray(Image.open(probe).convert("RGB")).astype(int)
        real_ok, detail = cf.compare(img)
        record("BASELINE check_fonts passes on the real probe (must be green)",
               real_ok, detail)
        # forge a probe where both rows are the same face, which is exactly what
        # the frame looks like when Inter never loaded
        forged = img.copy()
        forged[cf.ROW_B[0]:cf.ROW_B[1]] = img[cf.ROW_A[0]:cf.ROW_A[1]]
        bad_ok, detail = cf.compare(forged)
        record("NC10 identical rows (Inter absent) is caught by check_fonts",
               not bad_ok, detail)
    else:
        record("NC10 skipped, out/FontProbe.png not rendered", False, "missing")

    shutil.rmtree(NC, ignore_errors=True)

    total = len(RESULTS)
    good = sum(1 for _, ok, _ in RESULTS if ok)
    print(f"\n{good} of {total} controls behaved as required")
    return 0 if good == total else 1


if __name__ == "__main__":
    sys.exit(main())
