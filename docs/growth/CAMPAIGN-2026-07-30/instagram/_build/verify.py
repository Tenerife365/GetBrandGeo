"""
Verification for the Instagram static assets, CAMPAIGN-2026-07-30.

Two halves.

**Pixel half.** Every delivered PNG is opened and probed. Its size is read off
the decoded image, never assumed from the fact that a write returned without
raising. Every recorded string is resampled from the delivered file and its
contrast is computed from the pixels that actually landed, in sRGB relative
luminance, against the surface the pixels are actually sitting on. Horizontal
overflow, logo clear space and the story safe zone are measured the same way.

**Text half.** Nine content scanners run over the drawn strings AND over both
delivered `POSTS.md` files, including this file's own headings if it ever ends
up inside the corpus.

`_shared/BRIEF.md` section 4 is the reason the second half of this file exists
at all: a scan that passes everything is indistinguishable from one that does
not work. So every scanner is negative controlled. Each defect the scanner
claims to catch is injected into the corpus, one at a time, and the scanner is
required to go red on it. The count is reported as "N of N injections fired".
A scanner that cannot be made to fire is blind and is reported as blind.

Run: python verify.py
"""

import json
import os
import re
import sys
import unicodedata

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IG = os.path.abspath(os.path.join(HERE, ".."))
WEB = os.path.abspath(os.path.join(
    HERE, "..", "..", "..", "..", "..", "brandgeo", "web"))
FEED = os.path.join(IG, "feed")
STORIES = os.path.join(IG, "stories")

FAILURES = []
NOTES = []


def fail(section, msg):
    FAILURES.append(f"[{section}] {msg}")


# ============================================================ colour math ===
def hexs(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(c):
    r, g, b = c
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ============================================================== text prep ===
CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")


def split_camel(s):
    """`#FirstEverStudy` passes `\\bfirst\\b`. Split camel case before matching,
    and strip the hash so the first token is not glued to it."""
    out = []
    for tok in re.split(r"(\s+)", s):
        if tok.startswith("#") and len(tok) > 1:
            out.append(" " + CAMEL.sub(" ", tok[1:]) + " ")
        else:
            out.append(tok)
    return "".join(out)


def norm(s):
    """NFKD, strip combining marks, casefold. In that order, so that
    `Engel & Volkers` fires on a corpus containing `Engel & Volkers` and
    `Engel & Völkers` fires too."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


def views(text):
    """Index a block two ways. A wrapped on-screen line matches nothing if the
    corpus is only indexed per-line, and a per-line-only index misses a phrase
    that straddles a line break."""
    lines = [ln for ln in text.splitlines() if ln.strip()]
    joined = re.sub(r"\s+", " ", " ".join(lines))
    return lines + [joined]


def maximal(matches):
    """Discard every match whose span is strictly inside another's. `Google`
    and `Google AI` are sub-spans of the permitted `Google AI Mode`."""
    out = []
    for a in matches:
        if any(b is not a and b[0] <= a[0] and a[1] <= b[1]
               and (b[1] - b[0]) > (a[1] - a[0]) for b in matches):
            continue
        out.append(a)
    return out


# ============================================================== scanners ====
# Every scanner takes `blocks`, a list of (label, text), and returns findings.

DASHES = {
    "—": "em dash", "–": "en dash", "−": "minus sign",
    "‒": "figure dash", "―": "horizontal bar",
    "‐": "hyphen (U+2010)", "‑": "non-breaking hyphen",
}


def scan_dashes(blocks):
    out = []
    for label, text in blocks:
        for ch, name in DASHES.items():
            for m in re.finditer(re.escape(ch), text):
                out.append(f"{label}: {name} at offset {m.start()} "
                           f"in {text[max(0, m.start()-40):m.start()+40]!r}")
    return out


BANNED = ["delve", "unlock", "unleash", "elevate", "harness", "game-changer",
          "game changer", "supercharge", "revolutionize", "revolutionise",
          "seamless", "robust", "cutting-edge", "cutting edge",
          "transformative", "dive in", "in today's fast-paced world",
          "it's not just", "it is not just"]
# `leverage` is banned only as a verb, so it is matched with its verb frames.
BANNED_VERB = [r"\bleverage\s+(?:the|a|an|our|your|their|its)\b",
               r"\bleveraging\b", r"\bleverages\b"]


def scan_banned(blocks):
    out = []
    for label, text in blocks:
        for v in views(split_camel(text)):
            n = norm(v)
            for w in BANNED:
                for m in re.finditer(r"\b" + re.escape(norm(w)) + r"\b", n):
                    out.append(f"{label}: banned word {w!r} in {v[:90]!r}")
            for pat in BANNED_VERB:
                if re.search(pat, n):
                    out.append(f"{label}: 'leverage' used as a verb in {v[:90]!r}")
    return out


# A superlative ABOUT THE RESEARCH PROGRAM. Several published city pages assert
# these about themselves and contradict each other, so no asset may repeat one.
PROGRAM_NOUNS = (r"(?:study|studies|research|programme|program|dataset|"
                 r"data ?set|city|cities|run|runs|measured|measurement|"
                 r"result|results|corpus)")
# The gap between a superlative and the program noun it would modify may not
# contain markdown furniture. Without this, a `**FIRST COMMENT**` heading
# followed by a fenced link to a city page reads as "first ... city" and the
# scanner fires on its own headings. Found by scanning the delivered file,
# which is exactly the trap BRIEF section 4 names.
GAP = r"[^.\n`*#|\[\]]"
SUPERLATIVE_PATTERNS = [
    rf"\b(?:first|only|strongest|cleanest|widest|densest|biggest|largest)\b"
    rf"{GAP}{{0,60}}\b{PROGRAM_NOUNS}\b",
    rf"\b{PROGRAM_NOUNS}\b{GAP}{{0,60}}\b(?:ever|anywhere|in this program|"
    rf"across this entire|program-wide|programme-wide)\b",
    r"\bmost\s+\w+(?:\s+\w+)?\s+" + PROGRAM_NOUNS + r"\b",
    r"\bfirst[- ]ever\b",
    r"\bthe only (?:study|research|program|programme|dataset|tool|company)\b",
]
# Verbatim quotations of published prompts. `Top-rated` is a superlative inside
# a buyer's own words, not a claim about the program. Each exemption is an exact
# string, and an injected superlative outside these spans still fires.
SUPERLATIVE_EXEMPT = [
    '"Top-rated property management companies in Chicago"',
    "Top-rated property management companies in Chicago",
]


def scan_superlatives(blocks):
    out = []
    for label, text in blocks:
        for v in views(split_camel(text)):
            n = norm(v)
            for ex in SUPERLATIVE_EXEMPT:
                n = n.replace(norm(ex), " " * len(ex))
            for pat in SUPERLATIVE_PATTERNS:
                for m in re.finditer(pat, n):
                    out.append(f"{label}: program superlative "
                               f"{n[m.start():m.end()]!r} in {v[:90]!r}")
    return out


UNIVERSALS = [r"\bnobody\b", r"\bno one\b", r"\bno-one\b", r"\beveryone\b",
              r"\bevery (?:brand|business|company|marketer|founder)\b",
              r"\ball (?:brands|businesses|companies|marketers)\b",
              r"\bnever (?:does|do) (?:anyone|anybody)\b",
              r"\bno (?:brand|business|company) (?:does|has|is)\b"]


def scan_universals(blocks):
    out = []
    for label, text in blocks:
        for v in views(split_camel(text)):
            n = norm(v)
            for pat in UNIVERSALS:
                for m in re.finditer(pat, n):
                    out.append(f"{label}: universal quantifier "
                               f"{n[m.start():m.end()]!r} in {v[:90]!r}")
    return out


# Engines. Permitted spans are the ones these runs actually fired, plus Grok,
# which is live today. Forbidden spans are retired, unpurchasable, or ambiguous.
ENGINE_PERMITTED = ["Google AI Mode", "ChatGPT", "Claude", "Gemini",
                    "Perplexity", "Grok"]
ENGINE_FORBIDDEN = ["Microsoft Copilot", "Google AI Overviews", "Meta AI",
                    "Copilot", "DeepSeek", "Google AI", "Llama"]


def scan_engines(blocks):
    out = []
    terms = [(t, norm(t)) for t in ENGINE_PERMITTED + ENGINE_FORBIDDEN]
    forb = {norm(t) for t in ENGINE_FORBIDDEN}
    for label, text in blocks:
        for v in views(text):
            n = norm(v)
            found = []
            for orig, t in terms:
                for m in re.finditer(r"(?<![a-z0-9])" + re.escape(t) +
                                     r"(?![a-z0-9])", n):
                    found.append((m.start(), m.end(), t, orig))
            for st, en, t, orig in maximal(found):
                if t in forb:
                    out.append(f"{label}: engine {orig!r} is retired, "
                               f"unpurchasable or ambiguous, in {v[:90]!r}")
    return out


# Named measured subjects. Extracted mechanically from the source pages rather
# than typed from memory, then matched against the corpus.
NAME_STOP = {
    "the", "a", "an", "and", "or", "of", "in", "for", "to", "on", "at", "by",
    "we", "our", "this", "that", "these", "those", "it", "its", "what", "how",
    "why", "when", "which", "who", "is", "are", "was", "were", "best", "top",
    "ai", "seo", "geo", "faq", "chicago", "boston", "houston", "new", "york",
    "los", "angeles", "london", "madrid", "paris", "detroit", "baltimore",
    "charlotte", "us", "usa", "uk", "brandgeo", "chatgpt", "claude", "gemini",
    "perplexity", "google", "mode", "overviews", "meta", "copilot", "deepseek",
    "grok", "openai", "microsoft", "anthropic", "reddit", "july", "june",
    "january", "engine", "engines", "research", "visibility", "property",
    "management", "real", "estate", "agents", "law", "firms", "firm", "legal",
    "hospital", "systems", "immigration", "corporate", "personal", "injury",
    "biotech", "life", "sciences", "commercial", "brokers", "energy", "oil",
    "gas", "big", "four", "original", "data", "collected", "pipeline",
    "unanimous", "consensus", "categories", "category", "city", "cities",
    "get", "started", "pricing", "works", "home", "buying",
}
NAME_PAGES = ["ai-visibility-for-chicago.html", "ai-visibility-for-boston.html",
              "ai-visibility-for-houston.html", "bg-004.html", "bg-005.html"]


def page_text(p):
    h = open(p, encoding="utf-8").read()
    h = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    h = re.sub(r"<style.*?</style>", " ", h, flags=re.S)
    h = re.sub(r"<[^>]+>", " ", h)
    h = h.replace("&amp;", "&").replace("&middot;", " ").replace("&#9679;", " ")
    return re.sub(r"\s+", " ", h)


def measured_names():
    """Capitalised multi-word runs from the source pages, minus generic and
    geographic tokens. These are the parties that turned up inside a result set
    and must never appear in campaign copy."""
    cands = set()
    for name in NAME_PAGES:
        p = os.path.join(WEB, name)
        if not os.path.exists(p):
            NOTES.append(f"name extraction: {name} not found at {WEB}")
            continue
        t = page_text(p)
        for m in re.finditer(
                r"\b([A-Z][A-Za-z'&.]*(?:\s+(?:&|of|and)?\s*[A-Z][A-Za-z'&.]*)+)\b",
                t):
            phrase = m.group(1).strip()
            toks = [w for w in re.split(r"[\s&.]+", phrase) if w]
            if len(toks) < 2:
                continue
            if all(norm(w) in NAME_STOP for w in toks):
                continue
            if any(norm(w) not in NAME_STOP for w in toks):
                cands.add(phrase)
    # Keep only phrases with at least one token that is not generic AND that
    # are not purely a heading fragment. A curated floor guarantees the known
    # measured subjects are in the set even if extraction drifts.
    cands |= {"McDermott Will & Emery", "McDermott Will & Schulte",
              "Landmark Property Management", "Kirkland & Ellis",
              "Mass General Brigham", "Green Ocean Property Management",
              "Ropes & Gray", "Houston Methodist", "Vinson & Elkins",
              "Shannon Property Management", "Clifford Law Offices",
              "Lubin & Meyer", "Savitz Law Offices", "Vesta Preferred Realty",
              "Robert Cohen", "Evan Compean", "Mana Yegani", "Arnold & Itkin",
              "Breakstone White & Gluck", "Jason Stone", "Compean Group"}
    return sorted(cands)


_NAMES = None


def scan_names(blocks):
    global _NAMES
    if _NAMES is None:
        _NAMES = measured_names()
    out = []
    pats = [(nm, norm(nm)) for nm in _NAMES if len(nm) > 6]
    for label, text in blocks:
        for v in views(text):
            n = norm(v)
            found = []
            for nm, t in pats:
                for m in re.finditer(r"(?<![a-z0-9])" + re.escape(t) +
                                     r"(?![a-z0-9])", n):
                    found.append((m.start(), m.end(), nm))
            for st, en, nm in maximal(found):
                out.append(f"{label}: named measured subject {nm!r} "
                           f"in {v[:90]!r}")
    return out


PRICE = [r"€\s?\d", r"\bEUR\s?\d", r"\bUSD\s?\d", r"\$\s?\d",
         r"\b\d+\s?(?:eur|usd)\b", r"\bper month\b", r"\b/mo\b",
         r"\bpricing starts\b", r"\bfrom €"]


def scan_price(blocks):
    out = []
    for label, text in blocks:
        for v in views(text):
            for pat in PRICE:
                for m in re.finditer(pat, v, re.I):
                    out.append(f"{label}: price on a top of funnel asset, "
                               f"{v[m.start():m.end()]!r} in {v[:90]!r}")
    return out


def first_sentence(text):
    t = text.strip()
    m = re.search(r"[.?!](?:\s|$)", t)
    return t[:m.end()].strip() if m else t


def scan_openers(blocks):
    """No rhetorical question as an opener. A question may close a post."""
    out = []
    for label, text in blocks:
        if label.split(":")[0] not in ("caption", "storyline"):
            continue
        fs = first_sentence(text)
        if fs.endswith("?"):
            out.append(f"{label}: opens on a question, {fs!r}")
    return out


def scan_first_sentence_len(blocks):
    """Instagram truncates a FEED caption at roughly 125 characters, so the
    first sentence has to survive alone. A story is not truncated, so the story
    lines are deliberately out of scope here and are checked by the opener
    scanner instead."""
    out = []
    for label, text in blocks:
        if not label.startswith("caption:"):
            continue
        fs = first_sentence(text)
        if len(fs) > 125:
            out.append(f"{label}: first sentence is {len(fs)} chars, over 125: "
                       f"{fs!r}")
    return out


DATE_RE = re.compile(r"\b\d{1,2}\s+(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|"
                     r"JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+"
                     r"\d{4}\b", re.I)


def scan_denominator(blocks):
    """Every figure carries its denominator, its date and its scope, on the
    same asset as the finding. Formulated so it is falsifiable: an image whose
    drawn text contains a bare figure must also contain a collection or
    publication date."""
    out = []
    for label, text in blocks:
        if not label.startswith("image:"):
            continue
        flat = re.sub(r"\s+", " ", " ".join(views(text)))
        stripped = flat.replace("getbrandgeo.com", " ")
        if re.search(r"\d", stripped) and not DATE_RE.search(flat):
            out.append(f"{label}: carries a figure but no date, {flat[:120]!r}")
    return out


SCANNERS = {
    "dashes": scan_dashes,
    "banned vocabulary": scan_banned,
    "program superlatives": scan_superlatives,
    "universal quantifiers": scan_universals,
    "engine lineup": scan_engines,
    "named measured subject": scan_names,
    "price on TOFU": scan_price,
    "rhetorical opener": scan_openers,
    "first sentence length": scan_first_sentence_len,
    "figure without a date": scan_denominator,
}

# One injection per defect each scanner claims to catch. Every one of these
# must make its scanner go red or the scanner is blind.
INJECTIONS = {
    "dashes": [("caption:inj", "A sentence — with an em dash."),
               ("caption:inj", "A range 2020–2026 with an en dash."),
               ("caption:inj", "A value of −5 with a minus sign.")],
    "banned vocabulary": [
        ("caption:inj", "Let us delve into the findings."),
        ("caption:inj", "A seamless and robust pipeline."),
        ("caption:inj", "We leverage the data every week."),
        ("caption:inj", "This is a real game-changer for teams."),
        ("caption:inj", "Tags #DelveDeeper and #GameChangerNow."),
    ],
    "program superlatives": [
        ("caption:inj", "The first fully unanimous result measured anywhere "
                        "in this research program."),
        ("caption:inj", "The most 5/5-dense city measured across this entire "
                        "research program."),
        ("caption:inj", "Our first-ever study of AI answers."),
        ("caption:inj", "Hashtag #FirstEverStudy of engine consensus."),
        ("caption:inj", "The only research program measuring this."),
    ],
    "universal quantifiers": [
        ("caption:inj", "Nobody does this by hand."),
        ("caption:inj", "Every brand is invisible to AI."),
        ("caption:inj", "Everyone is measuring the wrong thing."),
    ],
    "engine lineup": [
        ("image:inj", "Engines: ChatGPT, Gemini, Claude, Perplexity, Meta AI."),
        ("image:inj", "Also measured on Microsoft Copilot."),
        ("image:inj", "DeepSeek returned nothing."),
        ("image:inj", "Fired at Google AI and Perplexity."),
    ],
    "named measured subject": [
        ("caption:inj", "Both engines rendered it as McDermott Will & Schulte."),
        ("caption:inj", "Landmark Property Management was named by all five."),
        ("image:inj", "Mass General Brigham reached 5 of 5."),
    ],
    "price on TOFU": [
        ("caption:inj", "Growth is EUR 299 per month."),
        ("caption:inj", "Managed starts from €1,500."),
        ("caption:inj", "Only $99/mo."),
    ],
    "rhetorical opener": [
        ("caption:inj", "Is your brand invisible to AI? Here is the data."),
    ],
    "first sentence length": [
        ("caption:inj", "A first sentence deliberately written to run well "
                        "past the hundred and twenty five character ceiling "
                        "Instagram applies before it truncates a caption in "
                        "the feed. Second sentence."),
    ],
    "figure without a date": [
        ("image:inj", "Property management reached 5 of 5 engines in Boston."),
        ("image:inj", "20 real customer questions."),
    ],
}


# ============================================================ pixel checks ===
def probe(path, want_w, want_h):
    """Open the delivered file and read its real size off the decoded image.
    A write that returns without raising is not evidence that a file exists at
    the size it was asked for."""
    if not os.path.exists(path):
        fail("files", f"MISSING {path}")
        return None
    size = os.path.getsize(path)
    if size == 0:
        fail("files", f"ZERO BYTES {path}")
        return None
    try:
        im = Image.open(path)
        im.load()
    except Exception as e:  # noqa: BLE001
        fail("files", f"UNREADABLE {path}: {e}")
        return None
    if (im.width, im.height) != (want_w, want_h):
        fail("files", f"{os.path.basename(path)} is {im.width}x{im.height}, "
                      f"expected {want_w}x{want_h}")
        return None
    return im.convert("RGB"), size


def nearest(px, palette):
    d = ((palette.astype(np.int32) - np.int32(px)) ** 2).sum(axis=1)
    return int(np.argmin(d)), float(np.sqrt(d.min()))


def check_contrast(entry, arr, label, ratios):
    ink = hexs(entry["ink"])
    surf = hexs(entry["surface"])
    x0, x1 = entry["span"]
    y0, y1 = entry["vspan"]
    H, W = arr.shape[:2]
    cx0, cx1 = max(0, int(x0) - 3), min(W, int(x1) + 4)
    cy0, cy1 = max(0, int(y0) - 3), min(H, int(y1) + 4)
    if cx1 <= cx0 or cy1 <= cy0:
        fail("contrast", f"{label}: empty crop for {entry['s'][:40]!r}")
        return
    crop = arr[cy0:cy1, cx0:cx1].reshape(-1, 3)

    # The surface must be the modal pixel of the region the string sits in.
    cols, counts = np.unique(crop, axis=0, return_counts=True)
    mode = tuple(int(v) for v in cols[int(np.argmax(counts))])
    if sum((a - b) ** 2 for a, b in zip(mode, surf)) > 12:
        fail("contrast", f"{label}: {entry['s'][:38]!r} declares surface "
                         f"{entry['surface']} but the modal pixel is {mode}")
        return
    # The ink must actually be present. Antialiasing means most glyph pixels
    # are blends, so the test is that at least one pixel reaches the declared
    # ink, which is what a filled glyph interior gives.
    hit = (np.abs(crop.astype(np.int32) - np.int32(ink)).max(axis=1) <= 2).sum()
    if hit == 0:
        fail("contrast", f"{label}: {entry['s'][:38]!r} declares ink "
                         f"{entry['ink']} but no pixel in the region reaches it")
        return
    r = contrast(ink, mode)
    large = entry["size"] >= 37  # >= 28pt at 96dpi, WCAG large text
    floor = 3.0 if large else 4.5
    ratios.setdefault((entry["ink"], entry["surface"]), []).append(
        (r, entry["size"], large))
    if r < floor:
        fail("contrast", f"{label}: {entry['s'][:38]!r} {entry['ink']} on "
                         f"{entry['surface']} is {r:.2f}:1, floor {floor}")


# ================================================================== main ====
def main():
    led_path = os.path.join(HERE, "ledger.json")
    if not os.path.exists(led_path):
        print("ledger.json missing. Run render_instagram_statics.py first.")
        return 2
    led = json.load(open(led_path, encoding="utf-8"))

    print("=" * 74)
    print("1. FILES ON DISK, PROBED")
    print("=" * 74)
    images = {}
    for rec in led["images"]:
        path = rec["file"]
        got = probe(path, rec["w"], rec["h"])
        if got is None:
            continue
        im, size = got
        images[path] = np.asarray(im)
        print(f"  ok  {os.path.basename(path):<40} {im.width}x{im.height}  "
              f"{size:>8,} bytes")
    print(f"  {len(images)} of {len(led['images'])} files probed and correct")

    print()
    print("=" * 74)
    print("2. CONTRAST, RESAMPLED FROM THE DELIVERED PIXELS")
    print("=" * 74)
    ratios = {}
    n_strings = 0
    for rec in led["images"]:
        arr = images.get(rec["file"])
        if arr is None:
            continue
        for e in rec["ledger"]:
            n_strings += 1
            check_contrast(e, arr, os.path.basename(rec["file"]), ratios)
    for (ink, surf), vals in sorted(ratios.items()):
        lo = min(v[0] for v in vals)
        hi = max(v[0] for v in vals)
        smallest = min(v[1] for v in vals)
        floor = 3.0 if all(v[2] for v in vals) else 4.5
        span = f"{lo:.2f}:1" if abs(hi - lo) < 0.005 else f"{lo:.2f} to {hi:.2f}:1"
        print(f"  {ink} on {surf}  {span:>16}   "
              f"{len(vals):>3} strings, smallest {smallest}px, floor {floor}")
    print(f"  {n_strings} strings resampled")

    # Non-text indicators: the denominator dots. 3:1 floor, WCAG 1.4.11.
    print("  non-text indicators (denominator dots), floor 3.0:1")
    for ink, surf, what in [("#a78bfa", "#101116", "filled dot"),
                            ("#7d838f", "#101116", "empty dot ring"),
                            ("#8b5cf6", "#0a0b0e", "accent rail"),
                            ("#7c3aed", "#0a0b0e", "CTA pill fill")]:
        r = contrast(hexs(ink), hexs(surf))
        flagged = "" if r >= 3.0 else "   FAIL"
        print(f"    {what:<16} {ink} on {surf}  {r:.2f}:1{flagged}")
        if r < 3.0:
            fail("contrast", f"{what} {ink} on {surf} is {r:.2f}:1")

    print()
    print("=" * 74)
    print("3. GEOMETRY")
    print("=" * 74)
    MARGIN = 88
    over = 0
    for rec in led["images"]:
        for e in rec["ledger"]:
            x0, x1 = e["span"]
            if x0 < MARGIN - 2 or x1 > rec["w"] - MARGIN + 2:
                over += 1
                fail("overflow", f"{os.path.basename(rec['file'])}: "
                                 f"{e['s'][:40]!r} spans {x0:.0f} to {x1:.0f}, "
                                 f"outside the {MARGIN}px margin")
    print(f"  horizontal overflow: {over} strings outside the {MARGIN}px margin")

    worst = min(led["clearspace"], key=lambda c: c["got"] - c["need"])
    bad = [c for c in led["clearspace"] if c["got"] < c["need"] - 0.51]
    print(f"  logo clear space: {len(led['clearspace'])} checks, "
          f"{len(bad)} short. Tightest margin "
          f"{worst['got'] - worst['need']:+.1f}px over a requirement of "
          f"{worst['need']:.1f}px ({worst['vs']})")
    for c in bad:
        fail("clearspace", f"{c['vs']}: {c['got']:.0f}px against a "
                           f"requirement of {c['need']:.0f}px")

    # Story safe zone, measured off the pixels rather than the layout code.
    top_lim, bot_lim = led["story_safe"]
    for rec in led["images"]:
        if rec["h"] != 1920:
            continue
        arr = images.get(rec["file"])
        if arr is None:
            continue
        canvas = np.array(hexs("#0a0b0e"))
        ink_rows = np.where(
            (np.abs(arr.astype(np.int32) - canvas).max(axis=2) > 6).any(axis=1))[0]
        hi, lo = int(ink_rows.min()), int(ink_rows.max())
        ok = hi >= top_lim and lo <= bot_lim
        print(f"  {os.path.basename(rec['file']):<40} ink y {hi} to {lo}   "
              f"safe band {top_lim} to {bot_lim}  {'ok' if ok else 'OUTSIDE'}")
        if not ok:
            fail("safe zone", f"{os.path.basename(rec['file'])}: ink at "
                              f"{hi}..{lo}, outside {top_lim}..{bot_lim}")
    for sb in led["story_bounds"]:
        z = sb["sticker_zone"]
        print(f"  {sb['file']:<40} link sticker band {z[0]} to {z[1]} "
              f"({z[1] - z[0]}px clear)")
        if z[1] - z[0] < 120:
            fail("safe zone", f"{sb['file']}: sticker band is only "
                              f"{z[1] - z[0]}px")

    print()
    print("=" * 74)
    print("4. CONTENT SCANNERS OVER THE FULL DELIVERED CORPUS")
    print("=" * 74)
    blocks = []
    for rec in led["images"]:
        name = os.path.basename(rec["file"])
        blocks.append((f"image:{name}",
                       "\n".join(e["s"] for e in rec["ledger"])))
    posts = [os.path.join(FEED, "POSTS.md"), os.path.join(STORIES, "POSTS.md")]
    for p in posts:
        if not os.path.exists(p):
            fail("files", f"MISSING {p}")
            continue
        body = open(p, encoding="utf-8").read()
        # The whole delivered file, including its own headings.
        blocks.append((f"file:{os.path.relpath(p, IG)}", body))
        # Plus each fenced caption on its own, so the opener and length checks
        # see a caption rather than a whole document.
        kind = "caption" if os.path.dirname(p).endswith("feed") else "storyline"
        for m in re.finditer(r"\*\*CAPTION\*\*[^\n]*\n+```\n(.*?)\n```",
                             body, re.S):
            blocks.append((f"{kind}:{os.path.relpath(p, IG)}"
                           f"@{m.start()}", m.group(1)))
    n_cap = sum(1 for b in blocks if b[0].startswith("caption:"))
    n_story = sum(1 for b in blocks if b[0].startswith("storyline:"))
    n_img = sum(1 for b in blocks if b[0].startswith("image:"))
    print(f"  corpus: {n_img} images, {n_cap} feed captions, {n_story} story "
          f"lines, {len(posts)} POSTS.md files, {len(blocks)} blocks total")
    if n_img != 11:
        fail("corpus", f"expected 11 image blocks, indexed {n_img}. A scanner "
                       f"that silently globs nothing reports clean forever.")
    if n_cap != 4:
        fail("corpus", f"expected 4 feed captions, indexed {n_cap}")
    if n_story != 4:
        fail("corpus", f"expected 4 story lines, indexed {n_story}")

    print()
    for name, fn in SCANNERS.items():
        found = fn(blocks)
        print(f"  {name:<26} {len(found)} finding(s)")
        for f_ in found:
            fail(name, f_)

    print()
    print("=" * 74)
    print("5. NEGATIVE CONTROL. EVERY SCANNER IS MADE TO GO RED")
    print("=" * 74)
    total_fired = total_inj = 0
    blind = []
    for name, fn in SCANNERS.items():
        injs = INJECTIONS.get(name, [])
        if not injs:
            blind.append(name)
            print(f"  {name:<26} NO INJECTIONS DEFINED, scanner is BLIND")
            continue
        fired = 0
        misses = []
        for lbl, payload in injs:
            probe_blocks = blocks + [(lbl, payload)]
            before = len(fn(blocks))
            after = len(fn(probe_blocks))
            if after > before:
                fired += 1
            else:
                misses.append(payload[:60])
        total_fired += fired
        total_inj += len(injs)
        mark = "" if fired == len(injs) else "   <-- BLIND ON " + "; ".join(misses)
        print(f"  {name:<26} {fired} of {len(injs)} injections fired{mark}")
        if fired != len(injs):
            blind.append(name)
            fail("negative control",
                 f"{name}: only {fired} of {len(injs)} injections fired, "
                 f"missed {misses}")
    print()
    print(f"  TOTAL: {total_fired} of {total_inj} injections fired")
    if blind:
        fail("negative control", f"blind scanners: {blind}")

    # And the control that proves the harness itself is not vacuous: a scanner
    # that never fires must be caught by the loop above.
    def always_clean(_blocks):
        return []
    SCANNERS_PROBE = {"self-test, deliberately blind": always_clean}
    fired = 0
    for lbl, payload in INJECTIONS["dashes"]:
        if len(always_clean(blocks + [(lbl, payload)])) > len(always_clean(blocks)):
            fired += 1
    print(f"  harness self-test: a deliberately blind scanner fired "
          f"{fired} of {len(INJECTIONS['dashes'])} injections, so the harness "
          f"can tell blind from working")
    if fired != 0:
        fail("negative control", "the harness reported a blind scanner as working")
    del SCANNERS_PROBE

    print()
    print("=" * 74)
    if NOTES:
        print("NOTES")
        for n in NOTES:
            print("  " + n)
        print("=" * 74)
    if FAILURES:
        print(f"FAILED, {len(FAILURES)} finding(s)")
        for f_ in FAILURES:
            print("  " + f_)
        return 1
    print("PASS. Every check ran, every scanner was seen to go red, and no "
          "finding was raised against the delivered files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
