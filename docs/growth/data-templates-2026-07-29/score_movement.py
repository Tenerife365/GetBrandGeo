"""
Template 2. Score movement card.

Answers: is this brand being named more often than it was?

STATUS: BLOCKED ON DATA. As of 2026-07-29 no client in the database has a
plottable series, so running this script produces an explicit awaiting-data
card, not a chart. It does not invent a trend and it cannot be made to.

The comparability gate is the whole point of this file
--------------------------------------------------------
BrandGEO's engine coverage changed repeatedly through July, and prompts were
added over time. A mention rate pooled across a day therefore moves when the
ENGINE MIX moves, whether or not the brand moved. Two clients have more than one
collection day, and both fail comparability:

  Bucate pe Roate, 2026-07-07  50.0 percent from 2 answers, Claude only
  Bucate pe Roate, 2026-07-21  78.6 percent from 28 answers, 5 engines

Publishing that as a rising line would be publishing BrandGEO's own collection
schedule and labelling it the client's visibility.

So `comparable_days()` below refuses any day whose (prompt_id, llm) signature
differs from the others, and `render()` refuses to plot fewer than two surviving
days. That guard stays in the code after data arrives. It is not scaffolding.

Usage:
  python score_movement.py                  # renders the awaiting-data card
  python score_movement.py --size og
  python score_movement.py --all
"""

import argparse
import os

import brandgeo_viz as bv

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "score-movement.json")
OUT = os.path.join(HERE, "out")


def comparable_days(series):
    """Keep only days that asked an identical set of (prompt_id, llm) pairs.

    `series` is a list of {day, points: [{prompt_id, llm, brand_mentioned}]}.
    Returns (kept, dropped) where kept is sorted by day.

    The signature is the set of pairs, not their count, so a day that merely
    ran the same engines against a different prompt set is correctly rejected.
    """
    if not series:
        return [], []
    sig = {}
    for d in series:
        sig[d["day"]] = frozenset((p["prompt_id"], p["llm"]) for p in d["points"])
    # the modal signature wins; everything else is dropped as incomparable
    counts = {}
    for s in sig.values():
        counts[s] = counts.get(s, 0) + 1
    best = max(counts, key=counts.get)
    kept = sorted([d for d in series if sig[d["day"]] == best],
                  key=lambda d: d["day"])
    dropped = [d["day"] for d in series if sig[d["day"]] != best]
    return kept, dropped


def rate(day):
    pts = day["points"]
    return 100.0 * sum(1 for p in pts if p["brand_mentioned"]) / len(pts)


# --------------------------------------------------------------------------

def _card(c, m, w, card_h):
    band = m.safe_bottom - m.safe_top
    top = m.safe_top + max(0, (band - card_h) / 2)
    bottom = top + card_h
    c.rect((m.pad, top, w - m.pad, bottom), fill=bv.SURFACE, radius=m.s(22),
           outline=bv.BORDER, width=max(1, m.s(1.2)))
    return top, bottom


def render_awaiting(blob, preset, out_dir):
    """The honest output when there is nothing to plot."""
    w, h = bv.SIZES[preset]
    m = bv.Metrics(w, h, preset)
    c = bv.Canvas(w, h, bv.BG)

    title_sz = m.s(34) if preset in ("og", "wide") else m.s(38)
    card_h = min(m.safe_bottom - m.safe_top, m.s(430))
    top, bottom = _card(c, m, w, card_h)

    x0 = m.pad + m.s(34)
    x1 = w - m.pad - m.s(34)
    y = top + m.s(34)

    c.text((x0, y), "SCORE MOVEMENT", "semibold", m.s(12), bv.WARN, "la",
           spacing=m.s(1.6))
    y += m.s(26)

    c.text((x0, y), "No trend to report yet", "bold", title_sz, bv.TEXT, "la")
    y += title_sz * 1.32

    a = blob["audit"]
    lines = [
        f"{a['clients_with_more_than_one_collection_day']} of "
        f"{a['clients_with_any_ok_results']} clients have more than one "
        f"collection day.",
        "Neither of those two asked the same questions of the same engines "
        "twice, so no",
        "two days are comparable. A line drawn through them would show "
        "BrandGEO's",
        "collection schedule, not the brand's visibility.",
    ]
    for ln in lines:
        c.text((x0, y), ln, "regular", m.s(15.5), bv.TEXT_2, "la")
        y += m.s(23)

    y += m.s(14)

    # the unblock condition, stated as a requirement rather than a promise
    c.rect((x0, y, x1, y + m.s(62)), fill=bv.SURFACE_2, radius=m.s(10),
           outline=bv.BORDER, width=max(1, m.s(1)))
    c.text((x0 + m.s(16), y + m.s(19)), "UNBLOCKS WHEN", "semibold", m.s(11),
           bv.AC_TEXT, "lm", spacing=m.s(1.4))
    c.text((x0 + m.s(16), y + m.s(41)),
           "one client has 2+ days with an identical (prompt, engine) set. "
           "Today: 0.",
           "regular", m.s(14.5), bv.TEXT, "lm")

    fy = bottom - m.s(30)
    bv.draw_footer(c, m, fy,
                   note="template ready · awaiting data · not a projection")

    name = f"score-movement_awaiting-data_{preset}.png"
    return c.save(os.path.join(out_dir, name))


def render_series(kept, dropped, meta, preset, out_dir):
    """The real chart. Runs only when 2+ comparable days exist.

    Form: a single-series line. One series, so no legend box; the title names
    it. Single brand hue, which is the only place brand violet is legal as a
    data colour, because there is no second series it could be confused with.
    """
    w, h = bv.SIZES[preset]
    m = bv.Metrics(w, h, preset)
    c = bv.Canvas(w, h, bv.BG)

    title_sz = m.s(34) if preset in ("og", "wide") else m.s(40)
    head_h = m.s(30) + m.s(26) + title_sz * 1.32 + m.s(36)
    foot_h = m.s(104)
    band = m.safe_bottom - m.safe_top
    plot_h = min(band - head_h - foot_h, m.s(420))
    card_h = head_h + plot_h + foot_h
    top, bottom = _card(c, m, w, card_h)

    x0 = m.pad + m.s(34)
    x1 = w - m.pad - m.s(34)
    y = top + m.s(30)

    vals = [rate(d) for d in kept]
    first, last = vals[0], vals[-1]
    delta = last - first

    c.text((x0, y), "SCORE MOVEMENT", "semibold", m.s(12), bv.AC_TEXT, "la",
           spacing=m.s(1.6))
    y += m.s(26)

    arrow = "up" if delta > 0 else ("down" if delta < 0 else "flat")
    c.text((x0, y), f"{meta['client']}: {last:.0f}% of AI answers",
           "bold", title_sz, bv.TEXT, "la")
    y += title_sz * 1.32

    dcol = bv.OK if delta > 0 else (bv.BAD if delta < 0 else bv.TEXT_2)
    sub = (f"{abs(delta):.0f} points {arrow} since {kept[0]['day']}, "
           f"same {len(kept[0]['points'])} question-engine pairs each time")
    c.text((x0, y), sub, "regular", m.s(15.5), dcol, "la")
    y += m.s(36)

    # ---- plot ------------------------------------------------------------
    py0, py1 = y, y + plot_h - m.s(46)
    px0, px1 = x0 + m.s(46), x1 - m.s(12)

    for g in range(5):
        gy = py1 - (py1 - py0) * g / 4
        c.line([(px0, gy), (px1, gy)], bv.BORDER, m.s(1))
        c.text((px0 - m.s(12), gy), f"{g * 25}%", "regular", m.s(12.5),
               bv.TEXT_3, "rm")

    n = len(kept)
    pts = []
    for i, v in enumerate(vals):
        px = px0 + (px1 - px0) * (i / max(1, n - 1))
        py = py1 - (py1 - py0) * (v / 100.0)
        pts.append((px, py))

    c.line(pts, bv.AC, m.s(2))
    for i, (px, py) in enumerate(pts):
        c.circle(px, py, m.s(6.5), fill=bv.SURFACE)      # 2px surface ring
        c.circle(px, py, m.s(4.5), fill=bv.AC)
        if i in (0, n - 1):                              # selective labels only
            c.text((px, py - m.s(16)), f"{vals[i]:.0f}%", "bold", m.s(14),
                   bv.TEXT, "mb")
        c.text((px, py1 + m.s(18)), kept[i]["day"][5:], "regular", m.s(12.5),
               bv.TEXT_3, "mm")

    fy = bottom - m.s(28)
    c.line([(x0, fy - m.s(46)), (x1, fy - m.s(46))], bv.BORDER, m.s(1))
    strap = f"{len(kept)} comparable collection days"
    if dropped:
        strap += f" · {len(dropped)} day(s) dropped as incomparable"
    c.text((x0, fy - m.s(28)), strap, "regular", m.s(13), bv.TEXT_2, "lm")
    bv.draw_footer(c, m, fy, note="measured, not modelled")

    name = f"score-movement_{meta['slug']}_{preset}.png"
    return c.save(os.path.join(out_dir, name))


def render(blob, preset="og", out_dir=OUT):
    series = blob.get("series") or []
    kept, dropped = comparable_days(series)
    if len(kept) < 2:
        return render_awaiting(blob, preset, out_dir), False
    return render_series(kept, dropped, blob.get("meta", {}), preset,
                         out_dir), True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", default="og", choices=list(bv.SIZES))
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()

    blob = bv.read_json(DATA)
    print("fonts:", bv.font_report())
    presets = ("og", "square", "portrait", "story") if a.all else (a.size,)
    for p in presets:
        path, plotted = render(blob, p, a.out)
        state = "PLOTTED" if plotted else "AWAITING DATA (no comparable days)"
        print(f"wrote {os.path.relpath(path, HERE)}  [{state}]")


if __name__ == "__main__":
    main()
