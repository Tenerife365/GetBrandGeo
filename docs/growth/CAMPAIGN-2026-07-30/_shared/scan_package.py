"""Package-wide compliance scan over the DELIVERED COPY in this package.

This is the coordinator's own check on six agents' output. It exists because
each agent negative-controlled its own scanner, which proves those scanners
work, not that all six applied the same rules.

**Five of its own bugs were found by running it, and every one produced a
confident wrong answer rather than an error.** Recorded here because each has
also bitten an agent in this campaign:

1. It scanned editorial prose, so it fired on agents documenting the claims
   they had REFUSED. Only fenced copy blocks are scanned now, which is what
   ships.
2. Its name harvester read the category column and reported `property
   management` and `corporate law` as named companies.
3. Its retired-engine check used a 160-character window and English-only
   exemptions, so it fired on every correct German, Spanish, Italian and French
   disclosure. Meta AI named in a historical lineup is required, not forbidden.
4. It never unescaped HTML entities, so `Kirkland &amp; Ellis` failed the
   proper-noun test and every ampersanded firm silently vanished. The harvest
   was 6 names from 37 pages and it still reported clean.
5. It scanned `_build/`, where each agent keeps its own scanner report,
   including a table of deliberately injected defects. Twelve findings that
   were proof an agent's scanner worked.

Run: python scan_package.py
"""

import glob
import html as html_mod
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.abspath(os.path.join(ROOT, ".."))
WEB = os.path.abspath(os.path.join(PKG, "..", "..", "..", "brandgeo", "web"))

ENGINEISH = re.compile(
    r"chatgpt|claude|gemini|perplexity|grok|copilot|deepseek|google ai|"
    r"meta ai|engine|unanimous|consensus", re.I)

# Title-cased phrases built entirely out of this domain's own vocabulary are
# section headings and product terms, not company names. `AI Visibility` and
# `Real Estate Marketing` both survived the lowercase oracle, because the pages
# genuinely never write them in lower case, and were reported as named
# measured subjects in four files. Our own name is here for the same reason.
DOMAIN = re.compile(
    r"\b(ai|visibility|search|seo|geo|brandgeo|research|marketing|"
    r"measurement|local|business|multilingual|answer|index|report)\b", re.I)

DASHES = {"—": "em dash", "–": "en dash", "−": "minus sign",
          "‒": "figure dash", "―": "horizontal bar"}

BANNED = ["delve", "unlock", "unleash", "elevate", "harness", "game-changer",
          "supercharge", "revolutionize", "revolutionise", "seamless",
          "robust", "cutting-edge", "transformative", "dive in",
          "fast-paced world"]

# Only claims about the research programme as a whole. `best` is deliberately
# absent: it is not a corpus superlative, and including it fired on a quoted
# placeholder template, "best what you sell in your city".
SUPER = re.compile(
    r"\b(first|only|strongest|cleanest|most\s+unanimous)\b"
    r"[^.\n]{0,40}?"
    r"\b(city|cities|programme|program|research|corpus|anywhere)\b", re.I)

UNIVERSAL = re.compile(
    r"\b(nobody|no one|everyone|everybody|every business|every brand|"
    r"all businesses|all brands|no business|no brand)\b", re.I)

DEAD = re.compile(r"\b(meta ai|copilot|deepseek)\b", re.I)
DEAD_OK = re.compile(
    r"retired|retir|ritirat|no longer|not (?:a )?live|left our|since|"
    r"nicht mehr|ya no|fuori dal|ne fait plus|was in this run|ran that day|"
    r"was not in|coming soon|reserved|excluded|failed|collected \d|"
    r"\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4}|deliberately", re.I)

RHETORICAL = re.compile(
    r"(?:^|\n)\s*(?:>|\*\*)?\s*"
    r"(what if|have you ever|did you know|ever wondered|why is it that)", re.I)

PRICE = re.compile(r"(?:EUR|€)\s?\d|\d+\s?(?:euros?|EUR)\b", re.I)
TOFU = ("instagram", "tiktok", "threads", "x", "facebook")

FENCE = re.compile(r"```[a-z]*\n(.*?)```", re.S)


def fold(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


def load_subjects():
    """Company names from the published research, from two places.

    `<td class="leader">` holds the named brand per row. The sibling `vertical`
    column holds CATEGORIES and is deliberately not read.

    Body prose holds the rest, in quotes, and for some names that is the only
    place they appear at all. The Chicago hallucination finding reads: rendered
    the real firm "McDermott Will & Emery" as "McDermott Will & Schulte".
    Harvesting table cells alone missed both spellings, leaving this scanner
    blind to the most sensitive pair of names in the corpus while reporting a
    confident clean run.

    A lowercase oracle drops anything the corpus also uses in lower case, which
    is what separates a firm name from a category.
    """
    if not os.path.isdir(WEB):
        return set(), 0
    pages = glob.glob(os.path.join(WEB, "ai-visibility-for-*.html"))
    cand, raw = set(), []
    for f in pages:
        h = open(f, encoding="utf-8", errors="replace").read()
        body = html_mod.unescape(re.sub(r"<[^>]+>", " ", h))
        raw.append(body)
        for cell in re.findall(r'<td class="leader"[^>]*>(.*?)</td>', h, re.S):
            t = html_mod.unescape(re.sub(r"<[^>]+>", " ", cell))
            t = re.sub(r"\([^)]*\)", " ", t)
            for part in re.split(r"\s*/\s*", t):
                part = " ".join(part.split()).strip(" ,.;")
                if len(part) >= 6 and re.match(r"^[A-Z]", part):
                    cand.add(part)
        for q in re.findall(r'["“]([^"“”\n]{6,60})["”]', body):
            part = " ".join(q.split()).strip(" ,.;")
            if re.match(r"^[A-Z][\w.'&-]*(?:[ ,]+(?:&|and|of|de|di|du|van|von|"
                        r"[A-Z][\w.'&-]*)){1,5}$", part):
                cand.add(part)
    blob = "\n".join(raw)
    final = set()
    for c in cand:
        if ENGINEISH.search(c):
            continue
        # every token is domain vocabulary, so it is a heading, not a firm
        if all(DOMAIN.fullmatch(t) for t in re.findall(r"[A-Za-z]+", c)):
            continue
        if re.search(r"(?<![\w])" + re.escape(c.lower()) + r"(?![\w])", blob):
            continue                    # used in lower case, so a category
        final.add(fold(c))
    return final, len(pages)


SUBJECTS, NPAGES = load_subjects()


def copy_blocks(text):
    """Only fenced blocks ship. Prose around them is the agent's reasoning."""
    return "\n".join(FENCE.findall(text))


def scan(text):
    out = []
    for ch, label in DASHES.items():
        if ch in text:
            out.append((label, text.count(ch)))
    low = text.lower()
    for w in BANNED:
        n = len(re.findall(r"\b" + re.escape(w) + r"\b", low))
        if n:
            out.append(("banned vocabulary: " + w, n))
    for m in SUPER.finditer(text):
        out.append(("programme superlative: "
                    + " ".join(m.group(0).split())[:60], 1))
    for m in UNIVERSAL.finditer(text):
        # "No brand reached 3-engine agreement IN THIS COLLECTION" is a
        # measurement with a denominator, not a claim over all businesses.
        sent = text[max(0, m.start() - 120): m.end() + 160]
        if re.search(r"in this (?:collection|run|set|study|sample)|"
                     r"in these results|of the \d|\d\s*(?:of|/)\s*\d",
                     sent, re.I):
            continue
        out.append(("universal: " + m.group(0), 1))
    for m in DEAD.finditer(text):
        win = text[max(0, m.start() - 400): m.end() + 400]
        if not DEAD_OK.search(win):
            out.append(("retired engine presented as live: " + m.group(0), 1))
    for m in RHETORICAL.finditer(text):
        out.append(("rhetorical opener: " + m.group(1), 1))
    f = fold(text)
    for s in SUBJECTS:
        if re.search(r"(?<![\w])" + re.escape(s) + r"(?![\w])", f):
            out.append(("measured subject named: " + s, 1))
    return out


CONTROLS = {
    "em dash": "this — that",
    "banned vocabulary": "let us delve into it",
    "programme superlative": "the first city in this research program",
    "universal": "nobody checks this",
    "retired engine as live": "we monitor Meta AI for you",
    "rhetorical opener": "\n\nWhat if your brand vanished",
    "measured subject": "we found McDermott Will & Schulte at the top",
}


def main():
    files = sorted(glob.glob(os.path.join(PKG, "**", "*.md"), recursive=True))
    build = os.sep + "_build" + os.sep
    files = [f for f in files
             if "_shared" not in f
             and build not in f
             and not os.path.basename(f).endswith("NOTES.md")
             and os.path.basename(f) not in ("README.md", "RUN.md")]
    if not files:
        sys.exit("ABORT: scanned zero files, the failure this exists to prevent")

    blocks, nblocks = {}, 0
    for f in files:
        found = FENCE.findall(open(f, encoding="utf-8", errors="replace").read())
        nblocks += len(found)
        blocks[f] = "\n".join(found)
    if nblocks == 0:
        sys.exit("ABORT: zero fenced copy blocks found, so nothing was scanned")
    print(f"corpus: {len(files)} POSTS files, {nblocks} fenced copy blocks, "
          f"{len(SUBJECTS)} names from {NPAGES} research pages")

    base = next(v for v in blocks.values() if v.strip())
    fired = 0
    for name, inj in CONTROLS.items():
        if len(scan(base + "\n" + inj)) > len(scan(base)):
            fired += 1
        else:
            print(f"  CONTROL FAILED: '{name}' did not fire")
    if fired != len(CONTROLS):
        sys.exit(f"ABORT: {fired} of {len(CONTROLS)} controls fired; "
                 f"this scanner cannot be trusted")
    print(f"controls: {fired} of {len(CONTROLS)} fired, "
          f"scanner is discriminating\n")

    total = 0
    for f in files:
        hits = scan(blocks[f])
        rel = os.path.relpath(f, PKG).replace("\\", "/")
        if PRICE.search(blocks[f]) and rel.split("/")[0] in TOFU:
            hits.append(("price on a TOFU asset", len(PRICE.findall(blocks[f]))))
        if hits:
            total += sum(h[1] for h in hits)
            print(rel)
            for h, n in hits:
                print(f"    {n:3d}  {h}")
    print(f"\ntotal findings in shipped copy: {total}")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
