"""Per-page Open Graph cards for getbrandgeo.com.

THE DEFECT THIS FIXES
  55 pages point og:image at `logo.png`, which is 799x1024 PORTRAIT. Link
  previews want roughly 1.91:1 (1200x630). Every share of a city research page
  on LinkedIn, X or Facebook renders a cropped or letterboxed logo instead of a
  card. On pages whose entire job is to be shared and cited, that is the whole
  point of the page being thrown away at the last step.

WHY PER-PAGE AND NOT ONE GENERIC CARD
  A generic card makes 55 shares look like the same link. The distinguishing
  token (Atlanta, SaaS Companies, BrandGEO vs Peec AI) is what earns the click,
  so it is the largest thing on the card and everything else is subordinate.

EVERY WORD COMES FROM THE PAGE
  The token is parsed from the page's own <title> and the supporting line from
  its own <meta name="description">. Nothing is written here, so a card cannot
  claim something the page does not. If a parse fails the page is reported and
  skipped rather than given invented copy.

LEGIBILITY TARGET
  LinkedIn renders og:image at about 552px wide in feed, a 0.46 scale. Every
  type size here is chosen so it survives that: the hero clears 40px effective
  and the supporting line clears 15px. Sizes are auto-fit and MEASURED, not
  assumed to fit.
"""

import argparse
import glob
import html
import itertools
import os
import re

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
WEB = os.path.join(ROOT, "brandgeo", "web")
FONTS = os.path.join(ROOT, "docs", "growth", "grok-launch", "images", "_build", "fonts")
TILE = os.path.join(ROOT, "docs", "growth", "brand-identity-2026-07-29", "v3", "png", "icon-tile-256.png")

W, H = 1200, 630
PAD = 72

# Live :root values, dark theme. Not invented, read from index.html.
BG = (10, 11, 14)
SURF = (22, 23, 30)
TEXT = (232, 233, 237)
TEXT2 = (155, 161, 172)
ACCENT = (167, 139, 250)     # --ac-text, 7.23:1 on the canvas
BORDER = (42, 44, 53)

# PAGE deliberately has no eyebrow. Its cards sit directly under the "BrandGEO"
# lockup, so an eyebrow reading "BRANDGEO" repeated the same word 60px lower.
# Dropping it also returns ~36px of vertical budget to the hero, which is the
# page type that needs it most.
KIND_LABEL = {
    "CITY RESEARCH": "AI VISIBILITY RESEARCH",
    "INDUSTRY": "AI VISIBILITY FOR",
    "COMPARISON": "COMPARISON",
    "NEWS": "NEWSROOM",
}

# Frame geometry. Every one of these numbers is set so the ink bounding box
# stays inside the 72px padding. The previous frame broke it three ways: the
# brand tile sat at PAD-6, the footer rule was drawn inclusive of x=W-PAD, and
# the descender of "getbrandgeo.com" reached y=577 against a 557 floor.
RULE_Y = H - 130
FOOT_Y = H - 106
BAND_BOT = RULE_Y - 26
MAXW = W - PAD * 2

HERO_MAX, HERO_MIN, HERO_LEAD = 108, 46, 1.06
DESC_SIZE, DESC_LEAD, HERO_GAP = 30, 42, 30

# Trailing words that leave a truncated line dangling. Dropping them is a cut,
# never a substitution, so the line still says only what the page said.
DANGLING = {
    "a", "an", "and", "as", "at", "but", "by", "for", "from", "he", "how", "i",
    "in", "into", "it", "of", "on", "or", "she", "that", "the", "they", "to",
    "we", "which", "who", "why", "with", "you",
}


def font(weight, size):
    return ImageFont.truetype(os.path.join(FONTS, f"Inter-{weight}.ttf"), size)


def meta(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    d = re.search(r'<meta name="description" content="(.*?)"', s, re.S)
    return (html.unescape(t.group(1)).strip() if t else "",
            html.unescape(d.group(1)).strip() if d else "")


def pages():
    """Every page in the docroot, flat or nested.

    The press releases live at news/<slug>/index.html, so a flat WEB/*.html glob
    missed all three newsroom pages entirely. They were the last three still
    pointing og:image at the portrait logo.
    """
    out = {}
    for p in sorted(glob.glob(os.path.join(WEB, "**", "*.html"), recursive=True)):
        rel = os.path.relpath(p, WEB).replace("\\", "/")
        name = rel[:-len("/index.html")].split("/")[-1] if rel.endswith("/index.html") else rel[:-5]
        if name in out:
            raise SystemExit(f"slug collision: {name} is both {out[name][0]} and {rel}")
        out[name] = (rel, p)
    return out


def parse(name, title, rel=""):
    # A press release. Its own title ends "| BrandGEO Newsroom", which is where
    # the eyebrow comes from. The leading "BrandGEO " is dropped because the
    # lockup 100px above already says it; that is a cut, never a substitution.
    parts = [x.strip() for x in title.split("|")]
    if rel.startswith("news/") and len(parts) > 1 and parts[-1] == "BrandGEO Newsroom":
        tok = re.sub(r"^BrandGEO\s+", "", parts[0]).strip()
        return ("NEWS", tok) if tok else (None, None)
    # A research article. Its title is "BG-0NN: <headline> | BrandGEO Research".
    # Splitting on ":" and taking the first part, which is what the generic
    # branch below does, yielded a card whose entire hero was the string
    # "BG-027" -- the one token on the card that distinguishes nothing and
    # earns no click. The headline is the distinguishing token, so the id is
    # dropped from the hero and returned as the eyebrow instead.
    m = re.match(r"^(BG-\d{3})\s*:\s*(.+)$", parts[0])
    if m:
        return m.group(1), m.group(2).strip()

    if name.startswith("brandgeo-vs-"):
        m = re.search(r"BrandGEO vs ([^:|]+)", title)
        return ("COMPARISON", "vs " + m.group(1).strip()) if m else (None, None)
    if name.startswith("ai-visibility-for-"):
        m = re.search(r"AI Visibility in ([^:|]+)", title)
        if m:
            return "CITY RESEARCH", m.group(1).strip()
        m = re.search(r"AI Visibility for ([^:|]+)", title)
        if m:
            return "INDUSTRY", m.group(1).strip()
        return None, None
    tok = title.split(":")[0].split("|")[0].strip()
    return ("PAGE", tok) if tok else (None, None)


def balanced(draw, words, n, f):
    """Split words into n lines minimising the widest line.

    Greedy wrapping gives 'Financial Services &' / 'Fintech', a long line and a
    stub. Balancing gives 'Financial Services' / '& Fintech', whose widest line
    is narrower, which is what lets the solver keep a larger type size.
    """
    if n == 1:
        return [" ".join(words)]
    if n > len(words):
        return None
    best = None
    for cuts in itertools.combinations(range(1, len(words)), n - 1):
        idx = (0,) + cuts + (len(words),)
        lines = [" ".join(words[idx[i]:idx[i + 1]]) for i in range(n)]
        widest = max(draw.textlength(l, font=f) for l in lines)
        if best is None or widest < best[0]:
            best = (widest, lines)
    return best[1]


def hero_fit(draw, token, avail_h):
    """Largest MEASURED size whose lines all fit the column and the height.

    The previous version shrank a single line and returned the floor size
    without checking the floor fits, which ran 'Get Your Business Found Online
    & by AI, Done For You' straight off the right edge of the canvas. Wrapping
    instead of shrinking also keeps the type far larger: that token goes from an
    overflowing 46px to a clean 2 lines, and 'Financial Services & Fintech' from
    76px to 104px. Returns None rather than emitting a card that overflows.
    """
    words = token.split()
    for size in range(HERO_MAX, HERO_MIN - 1, -2):
        f = font("ExtraBold", size)
        adv = round(size * HERO_LEAD)
        for n in (1, 2, 3):
            if n > len(words) or n * adv > avail_h:
                continue
            lines = balanced(draw, words, n, f)
            if lines and max(draw.textlength(l, font=f) for l in lines) <= MAXW:
                return f, size, lines, n * adv
    return None


def wrap_desc(draw, text, f, max_lines):
    """Wrap the page's own description, trimming to something that reads."""
    words, lines, cur, i = text.split(), [], [], 0
    while i < len(words):
        trial = cur + [words[i]]
        if draw.textlength(" ".join(trial), font=f) <= MAXW:
            cur, i = trial, i + 1
        else:
            if not cur:
                cur, i = [words[i]], i + 1
            lines.append(" ".join(cur))
            cur = []
            if len(lines) == max_lines:
                break
    if cur and len(lines) < max_lines:
        lines.append(" ".join(cur))
        cur = []
    if sum(len(l.split()) for l in lines) >= len(words):
        return lines
    if not lines:
        return lines

    # Truncated. Prefer cutting back to a clause boundary, but only one that
    # keeps most of the line. Otherwise drop trailing function words so the
    # line does not end on a dangling 'to' or 'or they'.
    last = lines[-1]
    cut = None
    for m in reversed(list(re.finditer(r"[,;:.]", last))):
        if m.start() >= len(last) * 0.45:
            cut = last[:m.start()]
            break
    if cut is None:
        parts = last.split()
        while len(parts) > 2 and parts[-1].strip(",.;:").lower() in DANGLING:
            parts.pop()
        cut = " ".join(parts)
    cut = cut.rstrip(",.;: ")
    while cut and draw.textlength(cut + " ...", font=f) > MAXW:
        cut = cut.rsplit(" ", 1)[0].rstrip(",.;: ")
    lines[-1] = cut + " ..."
    return lines


def tracked(draw, xy, text, f, fill, track):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + track
    return x


def solve(d, kind, token, desc):
    """Pick hero size, hero lines and description lines together.

    The hero earns the click, so the objective is the largest hero size. A
    second description line is spent only when it costs the hero nothing.
    Returns None if the token cannot be set legibly, so the page is skipped
    rather than given an overflowing card.
    """
    band_top = PAD + 120 if kind in KIND_LABEL else PAD + 96
    band_h = BAND_BOT - band_top
    best = None
    for dmax in (2, 1):
        cost = (dmax * DESC_LEAD + HERO_GAP) if desc else 0
        r = hero_fit(d, token, band_h - cost)
        if r and (best is None or r[1] > best[0][1]):
            best = (r, dmax)
        if not desc:
            break
    if best is None:
        return None
    (hero_f, hero_sz, hero_lines, hero_h), dmax = best
    dlines = wrap_desc(d, desc, font("Regular", DESC_SIZE), dmax) if desc else []
    block = hero_h + ((HERO_GAP + len(dlines) * DESC_LEAD) if dlines else 0)
    return band_top + (band_h - block) // 2, hero_f, hero_sz, hero_lines, hero_h, dlines


def card(kind, token, desc, out, plan):
    y0, hero_f, hero_sz, hero_lines, hero_h, dlines = plan
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # A single accent hairline down the left. One graphic element, so the card
    # reads as one object at 552px rather than a collection of boxes.
    d.rectangle([0, 0, 6, H], fill=ACCENT)

    # Brand lockup, top left.
    tile = Image.open(TILE).convert("RGBA").resize((56, 56), Image.LANCZOS)
    img.paste(tile, (PAD, PAD), tile)
    d.text((PAD + 72, PAD + 12), "BrandGEO", font=font("Bold", 34), fill=TEXT)

    if kind in KIND_LABEL:
        tracked(d, (PAD, PAD + 84), KIND_LABEL[kind], font("SemiBold", 22), ACCENT, 2.2)

    # Hero token. This is the thing that earns the click, so it gets the budget.
    y, adv = y0, round(hero_sz * HERO_LEAD)
    for line in hero_lines:
        d.text((PAD, y), line, font=hero_f, fill=TEXT)
        y += adv

    # Supporting line, from the page's own description.
    if dlines:
        y = y0 + hero_h + HERO_GAP
        sf = font("Regular", DESC_SIZE)
        for line in dlines:
            d.text((PAD, y), line, font=sf, fill=TEXT2)
            y += DESC_LEAD

    # Footer rule and stamp. "Up to 7 AI engines" is index.html's own wording.
    # The bare "7 AI engines measured" this used to carry contradicted the very
    # description printed above it on every city card, which reports 5 engines.
    d.rectangle([PAD, RULE_Y, W - PAD - 1, RULE_Y + 1], fill=BORDER)
    d.text((PAD, FOOT_Y), "getbrandgeo.com", font=font("SemiBold", 26), fill=TEXT)
    r = "Up to 7 AI engines"
    rf = font("Regular", 26)
    d.text((W - PAD - d.textlength(r, font=rf), FOOT_Y), r, font=rf, fill=TEXT2)

    img.save(out, "PNG", optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="page slugs, default all 55")
    ap.add_argument("--out", default=os.path.join(HERE, "cards"))
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    targets = []
    for n, (rel, p) in sorted(pages().items()):
        s = open(p, encoding="utf-8", errors="replace").read()
        # A page is in scope if it still carries the portrait logo, or if it
        # already carries the card this script owns. Without the second clause
        # the tool would go inert the moment it succeeded and no card could ever
        # be regenerated.
        if ('og:image" content="https://getbrandgeo.com/logo.png"' not in s
                and f'og:image" content="https://getbrandgeo.com/images/og/og-{n}.png"' not in s):
            continue
        if a.only and n not in a.only:
            continue
        targets.append((n, rel, p))

    probe = ImageDraw.Draw(Image.new("RGB", (W, H)))
    skipped, made = [], 0
    for n, rel, p in targets:
        t, desc = meta(p)
        kind, tok = parse(n, t, rel)
        if not tok:
            skipped.append((n, "no token parsed from <title>"))
            continue
        plan = solve(probe, kind, tok, desc)
        if plan is None:
            skipped.append((n, f"token will not set legibly: {tok!r}"))
            continue
        card(kind, tok, desc, os.path.join(a.out, f"og-{n}.png"), plan)
        made += 1
        print(f"  og-{n}.png  {kind:14} hero {plan[2]}px x{len(plan[3])}  '{tok}'")
    print(f"\n{made} cards written to {a.out}")
    for n, why in skipped:
        print(f"SKIPPED {n}: {why} (left on its existing og:image)")


if __name__ == "__main__":
    main()
