"""
Product-truth check for the plan ladder that P1EngineLadder animates.

THIS READS VALUES, NOT SHAPES, and it exists because of a specific past
failure: a verifier on this project passed a wrong ENGINE NAME because all it
could do was count engines. The count of Free's engines was 1 before the
2026-07-31 change and 1 after it. Only the name moved, from ChatGPT to Gemini.
Any check that counts is blind to exactly that.

So this parses:

  * PLAN_ORDER, PLAN_LABELS and PLAN_ENGINES out of
    brandgeo-dashboard/src/lib/planConfig.ts, which is the source of truth
  * P1_DEFAULT_PROPS.tiers out of brandgeo-video/src/P1EngineLadder.tsx, which
    is what will be on screen

and compares them rung by rung on four things:

  1. the rung LABELS, against PLAN_LABELS, in PLAN_ORDER order
  2. the engine COUNT, against len(PLAN_ENGINES[plan])
  3. the engine NAMES each rung adds over the rung below it, against the real
     set difference, mapped through ENGINE_META labels
  4. that no rung names an engine the plan does not carry, which is the check
     that catches a plausible-but-false name rather than a missing one

planConfig.ts is read-only here. Nothing in this file writes to the dashboard.

Usage:
    python tools/check_ladder.py                    # check the real file
    python tools/check_ladder.py path/to/other.tsx  # negative control uses this
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PLAN_CONFIG = os.path.join(REPO, "brandgeo-dashboard", "src", "lib", "planConfig.ts")
P1 = os.path.join(ROOT, "src", "P1EngineLadder.tsx")

# The ladder the card shows, bottom to top. `managed` carries the same engine
# set as `growth_pro`, which is why the top rung is labelled as a band rather
# than as one plan, and why this list stops at growth_pro.
RUNGS = ["free", "radar", "essentials", "growth", "growth_pro"]


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def strip_comments(s):
    """Remove // and /* */ so a commented-out ladder cannot be parsed as live.
    This matters here: planConfig.ts carries several superseded ladders in
    comment blocks, including one that still says Free is ChatGPT."""
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"^\s*//.*$", "", s, flags=re.M)
    return s


def parse_plan_engines(src):
    m = re.search(r"PLAN_ENGINES:\s*Record<Plan,\s*EngineId\[\]>\s*=\s*\{(.*?)\n\}",
                  src, re.S)
    if not m:
        raise SystemExit("could not find PLAN_ENGINES in planConfig.ts")
    out = {}
    for plan, arr in re.findall(r"(\w+):\s*\[([^\]]*)\]", m.group(1)):
        out[plan] = [e.strip().strip("'\"") for e in arr.split(",") if e.strip()]
    return out


def parse_plan_labels(src):
    m = re.search(r"PLAN_LABELS:\s*Record<Plan,\s*string>\s*=\s*\{(.*?)\n\}", src, re.S)
    if not m:
        raise SystemExit("could not find PLAN_LABELS in planConfig.ts")
    return dict(re.findall(r"(\w+):\s*'([^']*)'", m.group(1)))


def parse_plan_order(src):
    m = re.search(r"PLAN_ORDER:\s*Plan\[\]\s*=\s*\[([^\]]*)\]", src, re.S)
    if not m:
        raise SystemExit("could not find PLAN_ORDER in planConfig.ts")
    return [e.strip().strip("'\"") for e in m.group(1).split(",") if e.strip()]


def parse_engine_labels(src):
    m = re.search(r"ENGINE_META:\s*Record<EngineId,\s*\{(.*?)\n\}\s*=\s*\{(.*?)\n\}",
                  src, re.S)
    body = m.group(2) if m else src
    return dict(re.findall(r"(\w+):\s*\{\s*label:\s*'([^']*)'", body))


def parse_tiers(tsx):
    """Pull P1_DEFAULT_PROPS.tiers as (plan, engineCount, adds) triples."""
    m = re.search(r"P1_DEFAULT_PROPS[^=]*=\s*\{(.*?)\n\};", tsx, re.S)
    if not m:
        raise SystemExit("could not find P1_DEFAULT_PROPS")
    block = re.search(r"tiers:\s*\[(.*?)\n  \],", m.group(1), re.S)
    if not block:
        raise SystemExit("could not find tiers[] in P1_DEFAULT_PROPS")
    tiers = []
    for entry in re.findall(r"\{(.*?)\}", block.group(1), re.S):
        plan = re.search(r"plan:\s*'([^']*)'", entry)
        count = re.search(r"engineCount:\s*(\d+)", entry)
        adds = re.search(r"adds:\s*'([^']*)'", entry)
        if plan and count and adds:
            tiers.append((plan.group(1), int(count.group(1)), adds.group(1)))
    return tiers


def names_in(text, engine_labels):
    """Every engine label that literally appears in a rung's `adds` string.
    Longest first so 'Google AI Overviews' is not consumed by 'Google AI Mode'
    sharing a prefix, and so a real name is never split into a false one."""
    found = []
    hay = text
    for label in sorted(set(engine_labels.values()), key=len, reverse=True):
        if label in hay:
            found.append(label)
            hay = hay.replace(label, "\x00" * len(label))
    return set(found)


def main(argv):
    tsx_path = argv[1] if len(argv) > 1 else P1
    cfg = strip_comments(read(PLAN_CONFIG))
    tsx = read(tsx_path)

    engines = parse_plan_engines(cfg)
    labels = parse_plan_labels(cfg)
    order = parse_plan_order(cfg)
    elabels = parse_engine_labels(strip_comments(read(PLAN_CONFIG)))

    tiers = parse_tiers(tsx)
    fails = []

    print(f"planConfig.ts PLAN_ORDER: {order}")
    print(f"card rungs checked:       {RUNGS}\n")

    # ladder shape
    if [r for r in order if r in RUNGS] != RUNGS:
        fails.append(f"rung order does not match PLAN_ORDER: {order}")
    if len(tiers) != len(RUNGS):
        fails.append(f"card shows {len(tiers)} rungs, ladder has {len(RUNGS)}")

    for i, plan in enumerate(RUNGS):
        if i >= len(tiers):
            break
        shown_label, shown_count, shown_adds = tiers[i]
        real = engines[plan]
        below = engines[RUNGS[i - 1]] if i > 0 else []
        added = [e for e in real if e not in below]
        removed = [e for e in below if e not in real]

        expect_label = labels[plan]
        expect_names = {elabels[e] for e in added}
        shown_names = names_in(shown_adds, elabels)

        row_fail = []
        # 1. label
        if not shown_label.startswith(expect_label):
            row_fail.append(f"label '{shown_label}' != PLAN_LABELS '{expect_label}'")
        # 2. count
        if shown_count != len(real):
            row_fail.append(f"count {shown_count} != len(PLAN_ENGINES) {len(real)}")
        # 3. the names added, read as values
        if shown_names != expect_names:
            row_fail.append(
                f"names {sorted(shown_names) or '[]'} != added "
                f"{sorted(expect_names) or '[]'}")
        # 4. nothing named that the plan does not carry
        carried = {elabels[e] for e in real}
        stray = shown_names - carried
        if stray:
            row_fail.append(f"names an engine this plan does not carry: {sorted(stray)}")
        # 5. a rung must never lose an engine, which is the inversion the
        #    Radar ruling exists to prevent
        if removed:
            row_fail.append(f"rung DROPS {removed} relative to the rung below")

        mark = "ok  " if not row_fail else "FAIL"
        print(f"{mark} {plan:<11} shown '{shown_label}' {shown_count} "
              f"'{shown_adds}'")
        print(f"       real {real}")
        print(f"       adds {added or '[]'}")
        for m in row_fail:
            print(f"       !! {m}")
        fails += [f"{plan}: {m}" for m in row_fail]

    print()
    if fails:
        print(f"FAIL, {len(fails)} problem(s)")
        return 1
    print(f"PASS, {len(RUNGS)} of {len(RUNGS)} rungs match planConfig.ts "
          f"on label, count and engine names")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
