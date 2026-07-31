"""
Template 3. Cross-city comparison.

Answers: when you ask five AI engines the same four buying questions in twenty
different US cities, how many different companies do they name?

The answer is the product's whole argument. Nobody owns these categories. In
every city measured, the single most-named brand appeared in at most 4 of 20
answers, and most brands were named exactly once.

Form: horizontal stacked bars, one row per city, sorted by total. Cities are
nominal, so they are NOT coloured by value; the two stacked segments are the
only colour encoding and they are a frequency order, which makes them ordinal.
One hue, two lightness steps, dark-mode anchored so the more-repeated segment is
the lighter one. Validated with the dataviz validator as an ordinal ramp:
  #7c3aed -> #a78bfa   monotone L, adjacent dL >= 0.06, light end 3.31:1
A legend is present because there are two segments, and both segments carry a
value in the row, so identity never rests on colour alone.

Usage:
  python city_comparison.py --size portrait
  python city_comparison.py --size og --top 10
  python city_comparison.py --all
"""

import argparse
import os

import brandgeo_viz as bv

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "city-comparison.json")
OUT = os.path.join(HERE, "out")

REPEAT = "#a78bfa"   # named 2 or more times, the light step
ONCE = "#7c3aed"     # named exactly once, the dark step


def render(blob, preset="portrait", top=None, include_partial=False,
           out_dir=OUT):
    w, h = bv.SIZES[preset]
    m = bv.Metrics(w, h, preset)
    c = bv.Canvas(w, h, bv.BG)

    cities = [x for x in blob["cities"] if include_partial or x["complete"]]
    cities.sort(key=lambda x: -x["distinct_brands"])
    excluded = len(blob["cities"]) - len(cities)
    if top:
        cities = cities[:top]

    n = len(cities)
    peak = max(x["distinct_brands"] for x in cities)

    # ---- card ------------------------------------------------------------
    title_sz = m.s(34) if preset in ("og", "wide") else m.s(40)
    head_h = m.s(30) + m.s(26) + title_sz * 1.32 + m.s(34) + m.s(36)
    foot_h = m.s(104)
    band = m.safe_bottom - m.safe_top
    row_h = min((band - head_h - foot_h) / n, m.s(46))
    card_h = head_h + row_h * n + foot_h
    top_y = m.safe_top + max(0, (band - card_h) / 2)
    bottom = top_y + card_h

    c.rect((m.pad, top_y, w - m.pad, bottom), fill=bv.SURFACE, radius=m.s(22),
           outline=bv.BORDER, width=max(1, m.s(1.2)))

    x0 = m.pad + m.s(34)
    x1 = w - m.pad - m.s(34)
    y = top_y + m.s(30)

    c.text((x0, y), "AI ANSWER FRAGMENTATION", "semibold", m.s(12), bv.AC_TEXT,
           "la", spacing=m.s(1.6))
    y += m.s(26)

    c.text((x0, y), "Nobody owns the answer", "bold", title_sz, bv.TEXT, "la")
    y += title_sz * 1.32

    c.text((x0, y),
           "Distinct companies named by 5 AI engines answering the same "
           "4 buying questions, per city",
           "regular", m.s(15.5), bv.TEXT_2, "la")
    y += m.s(34)

    # ---- legend (two segments, so a legend is mandatory) -----------------
    lx = x0
    for col, lab in ((REPEAT, "named 2+ times"), (ONCE, "named exactly once")):
        c.rect((lx, y - m.s(5), lx + m.s(11), y + m.s(5)), fill=col,
               radius=m.s(3))
        lx += m.s(17)
        lx += c.text((lx, y), lab, "regular", m.s(13.5), bv.TEXT_2, "lm")
        lx += m.s(22)
    y += m.s(36)

    # ---- rows ------------------------------------------------------------
    name_sz = min(m.s(15.5), row_h * 0.56)
    val_sz = min(m.s(15), row_h * 0.56)
    label_w = max(c.measure(x["city"], "semibold", name_sz) for x in cities) + m.s(20)
    val_w = m.s(52)
    tx0 = x0 + label_w
    tx1 = x1 - val_w
    bar_h = min(row_h * 0.46, m.s(19))

    for i, x in enumerate(cities):
        cy = y + row_h * i + row_h / 2
        total = x["distinct_brands"]
        once = x["named_once"]
        rep = total - once

        c.text((x0, cy), x["city"], "semibold", name_sz, bv.TEXT, "lm")

        full = (tx1 - tx0) * (total / peak)
        rw = full * (rep / total)

        # repeat segment from the origin, then the once-only tail.
        # A 2px surface-coloured gap separates the two fills.
        c.rect((tx0, cy - bar_h / 2, tx0 + full, cy + bar_h / 2),
               fill=ONCE, radius=bar_h / 2)
        if rep > 0:
            c.rect((tx0, cy - bar_h / 2, tx0 + max(rw, bar_h), cy + bar_h / 2),
                   fill=REPEAT, radius=bar_h / 2)
            c.rect((tx0 + max(rw, bar_h), cy - bar_h / 2,
                    tx0 + max(rw, bar_h) + m.s(2), cy + bar_h / 2),
                   fill=bv.SURFACE)

        c.text((x1, cy), str(total), "bold", val_sz, bv.TEXT, "rm")

    y += row_h * n

    # ---- footer ----------------------------------------------------------
    fy = bottom - m.s(28)
    c.line([(x0, fy - m.s(46)), (x1, fy - m.s(46))], bv.BORDER, m.s(1))

    strap = (f"{n} US cities · 20 AI answers each · most-named brand in any "
             f"city appeared in at most 4 of 20")
    c.text((x0, fy - m.s(28)), strap, "regular", m.s(13), bv.TEXT_2, "lm")

    note = "2026-07-24/25 · measured, not modelled"
    if excluded and not include_partial:
        note = f"{excluded} city excluded, incomplete coverage · " + note if excluded == 1 \
            else f"{excluded} cities excluded, incomplete coverage · " + note
    bv.draw_footer(c, m, fy, note=note)

    tag = f"top{top}" if top else ("all" if include_partial else "complete")
    name = f"city-comparison_{tag}_{preset}.png"
    return c.save(os.path.join(out_dir, name))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", default="portrait", choices=list(bv.SIZES))
    ap.add_argument("--top", type=int, default=None,
                    help="show only the top N cities by distinct brands")
    ap.add_argument("--include-partial", action="store_true",
                    help="include cities whose 4x5 coverage is incomplete")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()

    blob = bv.read_json(DATA)
    print("fonts:", bv.font_report())
    made = []
    if a.all:
        made.append(render(blob, "portrait", None, False, a.out))
        made.append(render(blob, "square", None, False, a.out))
        made.append(render(blob, "og", 8, False, a.out))
        made.append(render(blob, "story", None, False, a.out))
    else:
        made.append(render(blob, a.size, a.top, a.include_partial, a.out))
    for p in made:
        print("wrote", os.path.relpath(p, HERE))


if __name__ == "__main__":
    main()
