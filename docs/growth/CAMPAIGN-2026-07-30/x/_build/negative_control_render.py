"""Negative controls for every check inside `render_campaign_images.py`.

BRIEF section 4: a scan that passes everything is indistinguishable from one
that does not work. So each check below is fed the exact defect it claims to
catch, and the run fails if the check stays quiet.

Nothing here writes an image. Each control builds an Asset in memory, injects
one defect, and asserts the corresponding check reports it.

Run: python negative_control_render.py
"""

import sys

import render_campaign_images as R

FIRED = []
BLIND = []


def control(label, fn):
    try:
        fired, detail = fn()
    except Exception as e:                      # a raising guard IS the check
        fired, detail = True, f"{type(e).__name__}: {e}"
    (FIRED if fired else BLIND).append((label, detail))
    print(f"  [{'FIRED' if fired else 'BLIND'}] {label}\n           {detail}")


def _asset(w=1600, h=900, scale=R.X_SCALE):
    return R.Asset("control.png", w, h, scale, R.X_OUT)


# 1. the fill-as-text guard
def c_fill_as_text():
    a = _asset()
    a.text("x", (100, 100), "violet words", R.font("Bold", 80), R.AC)
    return False, "text() accepted #8b5cf6 as a text colour"


# 2. containment: a card header wider than the card
def c_overflow():
    a = _asset()
    bx = a.card(1000, 300, 400, 300)
    a.text("head", (1040, 330),
           "A HEADER FAR TOO LONG FOR FOUR HUNDRED PIXELS OF CARD",
           R.font("SemiBold", 40), R.T3, surface=R.S, box=bx)
    bad = a.check_containment()
    return bool(bad), (bad[0] if bad else "check_containment stayed silent")


# 3. collision: two text groups written on top of each other
def c_collision():
    a = _asset()
    a.text("alpha", (100, 400), "One line of copy", R.font("Bold", 70), R.T)
    a.text("beta", (100, 420), "Another line on top", R.font("Bold", 70), R.T)
    bad = a.check_collisions()
    return bool(bad), (bad[0] if bad else "check_collisions stayed silent")


# 3b. and the same check must NOT fire on tightly led lines of one block,
#     which is the false positive that made a naive per-line version useless
def c_collision_false_positive():
    a = _asset()
    a.block("headline", (100, 300), ["Line one", "Line two", "Line three"],
            R.font("ExtraBold", 84), R.T, leading=1.04)
    bad = a.check_collisions()
    return not bad, ("silent on a tight block, correct" if not bad
                     else f"false positive: {bad[0]}")


# 4. legibility: type under the effective floor
def c_legibility():
    a = _asset()
    a.text("tiny", (100, 100), "unreadable at a third size",
           R.font("Regular", 20), R.T2)
    bad = a.check_legibility()
    return bool(bad), (f"{bad[0][0]} {bad[0][1]}px -> {bad[0][2]:.1f}px"
                       if bad else "check_legibility stayed silent")


# 4b. and it must stay silent on type that clears the floor
def c_legibility_false_positive():
    a = _asset()
    a.text("ok", (100, 100), "fine", R.font("Regular", 40), R.T2)
    bad = a.check_legibility()
    return not bad, ("silent on 40px, correct" if not bad
                     else f"false positive: {bad[0]}")


# 5. lockup clear space: an element pushed inside the exclusion ring
def c_clearspace():
    a = _asset()
    a.lockup(1600 - 96, 88, 104, anchor="rt")
    a.text("intruder", (1250, 150), "too close to the mark",
           R.font("Medium", 44), R.T2)
    clear, frac, problems = a.check_lockup_clearspace()
    return bool(problems), (problems[0] if problems
                            else "check_lockup_clearspace stayed silent")


# 5b. clear space running off the canvas edge
def c_clearspace_edge():
    a = _asset()
    a.lockup(20, 10, 104, anchor="lt")
    clear, frac, problems = a.check_lockup_clearspace()
    return bool(problems), (problems[0] if problems
                            else "an off-canvas lockup passed")


# 6. the anti-upscale guard on the source raster
def c_upscale():
    a = _asset()
    a.lockup(1600 - 96, 88, 900, anchor="rt")
    return False, "the lockup was upscaled past its source height"


# 7. contrast: a pairing that fails AA
def c_contrast():
    a = _asset()
    # T3 body copy on the raised surface is the tightest real pairing at
    # 4.69:1. Drop the foreground two steps and it must fail.
    a.text("dim", (100, 100), "muted body copy", R.font("Regular", 30),
           R.PART, surface=R.WARN)
    rows = [r for r in a.contrast_rows() if not r[4]]
    return bool(rows), (f"{rows[0][0]} on {rows[0][1]} = {rows[0][2]:.2f}:1"
                        if rows else "contrast_rows reported a pass")


# 7b. and the same computation must pass a known-good pairing
def c_contrast_false_positive():
    a = _asset()
    a.text("ok", (100, 100), "primary", R.font("Regular", 30), R.T, surface=R.BG)
    rows = [r for r in a.contrast_rows() if not r[4]]
    return not rows, ("16.22:1 passed, correct" if not rows
                      else f"false positive: {rows[0]}")


# 8. the colour maths itself, against published reference values
def c_contrast_maths():
    got = R.contrast("#ffffff", "#8b5cf6")
    want = 4.23   # BRIEF section 5: white on the accent fill fails AA at 4.23
    ok = abs(got - want) < 0.02
    return ok, f"white on #8b5cf6 computed {got:.2f}:1, brief states {want}"


CONTROLS = [
    ("fill colour passed to text()", c_fill_as_text),
    ("text overflowing its card", c_overflow),
    ("two text groups colliding", c_collision),
    ("tight leading is NOT a collision", c_collision_false_positive),
    ("type under the legibility floor", c_legibility),
    ("40px is NOT under the floor", c_legibility_false_positive),
    ("element inside the lockup clear space", c_clearspace),
    ("lockup clear space off the canvas", c_clearspace_edge),
    ("lockup upscaled past its source", c_upscale),
    ("a text pairing that fails AA", c_contrast),
    ("a passing pairing is NOT flagged", c_contrast_false_positive),
    ("contrast maths against a published value", c_contrast_maths),
]


def main():
    print("negative controls for render_campaign_images.py\n")
    for label, fn in CONTROLS:
        control(label, fn)
    print(f"\n{len(FIRED)} of {len(CONTROLS)} injections fired")
    if BLIND:
        print("\nBLIND CHECKS, these have told you nothing:")
        for label, detail in BLIND:
            print(f"  {label}: {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
