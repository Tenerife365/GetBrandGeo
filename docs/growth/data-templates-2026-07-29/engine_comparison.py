"""
Template 1. Engine comparison card.

Answers one question: which AI engines name this brand, and which do not.

Form: horizontal bars, one row per engine. Bar length encodes the mention rate,
which is magnitude. Bar colour encodes engine identity, which is the subject of
the card, so categorical is the correct job here and the palette in
brandgeo_viz.ENGINE_COLOR is the validated one. Every bar carries a direct label
(count and percent) and every row carries the engine name, so identity is never
carried by colour alone. That direct labelling is also the secondary encoding
the CVD rule requires.

Zero is rendered as zero. A brand that no engine mentions gets an empty track
and a stated "0 of N", never a hidden or minimum-width bar.

Usage:
  python engine_comparison.py --dataset bpr-2026-07-21 --size og
  python engine_comparison.py --all
"""

import argparse
import os

import brandgeo_viz as bv

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "engine-comparison.json")
OUT = os.path.join(HERE, "out")


def headline(ds):
    total_a = sum(e["answers"] for e in ds["engines"])
    total_m = sum(e["mentions"] for e in ds["engines"])
    n_eng = len(ds["engines"])
    hit = sum(1 for e in ds["engines"] if e["mentions"] > 0)
    return total_a, total_m, n_eng, hit


def render(ds, preset="og", out_dir=OUT):
    w, h = bv.SIZES[preset]
    m = bv.Metrics(w, h, preset)
    c = bv.Canvas(w, h, bv.BG)

    total_a, total_m, n_eng, hit = headline(ds)
    engines = sorted(ds["engines"],
                     key=lambda e: (-(e["mentions"] / e["answers"]), e["llm"]))

    # ---- card surface ----------------------------------------------------
    # Height is derived from content, then centred inside the channel's safe
    # band. A card stretched to fill a 9:16 frame is mostly empty space, and on
    # story formats the safe band is only 51 percent of the frame anyway.
    title_sz = m.s(37) if preset in ("og", "wide") else m.s(42)
    head_h = m.s(34) + m.s(26) + title_sz * 1.16 + m.s(34)
    row_h = min((m.safe_bottom - m.safe_top - head_h - m.s(94)) / len(ds["engines"]),
                m.s(84))
    card_h = head_h + row_h * len(ds["engines"]) + m.s(94)

    band = m.safe_bottom - m.safe_top
    top = m.safe_top + max(0, (band - card_h) / 2)
    bottom = top + card_h
    c.rect((m.pad, top, w - m.pad, bottom), fill=bv.SURFACE, radius=m.s(22),
           outline=bv.BORDER, width=max(1, m.s(1.2)))

    x0 = m.pad + m.s(34)
    x1 = w - m.pad - m.s(34)
    y = top + m.s(34)

    # ---- eyebrow ---------------------------------------------------------
    c.text((x0, y), "AI VISIBILITY", "semibold", m.s(12.5), bv.AC_TEXT, "la",
           spacing=m.s(1.6))
    y += m.s(26)

    # ---- headline --------------------------------------------------------
    c.text((x0, y), ds["client"], "bold", title_sz, bv.TEXT, "la")
    y += title_sz * 1.16

    sub = f"named in {total_m} of {total_a} AI answers across {n_eng} engines"
    if total_m == 0:
        sub = f"named in 0 of {total_a} AI answers across {n_eng} engines"
    c.text((x0, y), sub, "regular", m.s(17), bv.TEXT_2, "la")
    y += m.s(34)

    # ---- rows ------------------------------------------------------------
    bar_h = min(row_h * 0.30, m.s(17))

    # label column is measured, not guessed, so the longest engine name can
    # never collide with the track
    longest = max(c.measure(bv.ENGINE_LABEL.get(e["llm"], e["llm"]),
                            "semibold", m.s(16.5)) for e in engines)
    label_w = m.s(20) + longest + m.s(22)
    val_w = m.s(122)
    track_x0 = x0 + label_w
    track_x1 = x1 - val_w

    for i, e in enumerate(engines):
        cy = y + row_h * i + row_h / 2
        col = bv.ENGINE_COLOR.get(e["llm"], bv.TEXT_3)
        rate = e["mentions"] / e["answers"]

        # identity: swatch + name, so colour is never the only cue
        c.circle(x0 + m.s(6), cy, m.s(5.5), fill=col)
        c.text((x0 + m.s(20), cy), bv.ENGINE_LABEL.get(e["llm"], e["llm"]),
               "semibold", m.s(16.5), bv.TEXT, "lm")

        # inert track
        c.rect((track_x0, cy - bar_h / 2, track_x1, cy + bar_h / 2),
               fill=bv.mix(bv.SURFACE, bv.BORDER_2, 0.85), radius=bar_h / 2)

        # data end, rounded, anchored to the track origin
        if rate > 0:
            bw = (track_x1 - track_x0) * rate
            bw = max(bw, bar_h)  # keep the cap circular at very low rates
            c.rect((track_x0, cy - bar_h / 2, track_x0 + bw, cy + bar_h / 2),
                   fill=col, radius=bar_h / 2)

        # direct label, always present
        pct = f"{round(rate * 100)}%"
        cnt = f"{e['mentions']}/{e['answers']}"
        pct_col = bv.TEXT if rate > 0 else bv.TEXT_3
        c.text((x1, cy), pct, "bold", m.s(19), pct_col, "rm")
        c.text((x1 - m.s(58), cy), cnt, "regular", m.s(14.5), bv.TEXT_3, "rm")

    # ---- footer ----------------------------------------------------------
    fy = bottom - m.s(30)
    c.line([(x0, fy - m.s(26)), (x1, fy - m.s(26))], bv.BORDER, m.s(1))
    note = f"{ds['day']} · {ds['market']} · measured, not modelled"
    bv.draw_footer(c, m, fy, note=note)

    name = f"engine-comparison_{ds['key']}_{preset}.png"
    return c.save(os.path.join(out_dir, name))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", help="key from data/engine-comparison.json")
    ap.add_argument("--size", default="og", choices=list(bv.SIZES))
    ap.add_argument("--all", action="store_true",
                    help="every dataset in the core render set")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()

    blob = bv.read_json(DATA)
    sets = {d["key"]: d for d in blob["datasets"]}

    print("fonts:", bv.font_report())
    made = []
    if a.all:
        for k in sets:
            for p in ("og", "square", "portrait", "story"):
                made.append(render(sets[k], p, a.out))
    else:
        key = a.dataset or next(iter(sets))
        if key not in sets:
            raise SystemExit(f"unknown dataset {key}. have: {', '.join(sets)}")
        made.append(render(sets[key], a.size, a.out))
    for p in made:
        print("wrote", os.path.relpath(p, HERE))


if __name__ == "__main__":
    main()
