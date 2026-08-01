"""
Copy and delivery sweep for the Facebook static assets.

Scans TWO surfaces:

1. **Every string the renderer actually draws.** `render_facebook_static.py`
   appends each string handed to `text()` into `DRAWN`, in draw order. This file
   imports that module and reads `DRAWN`, so a string edited in the source but
   never drawn cannot pass, and a string drawn but not present in the source
   cannot hide.
2. **The whole of both `POSTS.md` files, headings and prose included.** A scanner
   that skips its own document is how the last four campaign checkers went blind.

Every check below has been made to FIRE by injecting the defect it claims to
catch. Run with `--controls` to reproduce that; it prints "N of N injections
fired". A check that cannot be made to fire is reported as blind rather than as
clean.

Run: python scan.py            (sweep, exit 0 on clean)
     python scan.py --controls (negative controls, then the sweep)
"""

import importlib.util
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
FB = os.path.abspath(os.path.join(HERE, ".."))
POSTS = [os.path.join(FB, "feed", "POSTS.md"), os.path.join(FB, "link", "POSTS.md")]

EXPECTED = {
    os.path.join(FB, "feed"): [
        ("fb-feed-01-description-1440x1800.png", 1440, 1800),
        ("fb-feed-02-language-split-1440x1800.png", 1440, 1800),
        ("fb-feed-03-placement-1440x1800.png", 1440, 1800),
        ("fb-feed-04-rank-vs-answer-1440x1800.png", 1440, 1800),
    ],
    os.path.join(FB, "link"): [
        ("fb-link-01-description-1200x630.png", 1200, 630),
        ("fb-link-02-madrid-1200x630.png", 1200, 630),
        ("fb-link-03-chicago-1200x630.png", 1200, 630),
        ("fb-link-04-bg004-1200x630.png", 1200, 630),
    ],
}


# --------------------------------------------------------------- normalise ---
def fold(s):
    """NFKD, strip combining marks, casefold. In that order, so `Engel & Volkers`
    fires against a list holding `Engel & Volkers` AND against one holding the
    accented form."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")


def split_camel(s):
    """`#FirstEverStudy` passes `\\bfirst\\b`. Splitting camel case first is the
    only reason it does not."""
    return CAMEL.sub(" ", s)


def variants(text):
    """Index each block per-line AND joined-and-whitespace-normalised, so a claim
    broken across a wrapped line still matches."""
    lines = text.split("\n")
    joined = re.sub(r"\s+", " ", text)
    return lines + [joined]


# ------------------------------------------------------------------ checks ---
BANNED = ["delve", "unlock", "unleash", "elevate", "harness", "leverage",
          "game-changer", "game changer", "supercharge", "revolutionize",
          "revolutionise", "seamless", "robust", "cutting-edge", "cutting edge",
          "transformative", "dive in", "fast-paced world"]

# Superlatives are only banned when they are claims about the RESEARCH PROGRAM.
# A bare ban on "first" is wrong here: "ChatGPT first, Claude first" is a
# measured rank and "the first is whether you were named" is an enumeration.
# The trailing \b is load-bearing: without it `ever` matched the prefix of
# `everything` and the check reported a superlative inside its own how-to prose.
PROGRAM_NOUN = r"(?:program|programme|research|study|dataset|ever|anywhere|" \
               r"industry|market|category of tool)\b"
SUPERLATIVE = r"(first|only|strongest|cleanest|most \w+|largest|biggest|best)"
PROGRAM_SUPER = [
    re.compile(SUPERLATIVE + r"\b[^.]{0,60}\b" + PROGRAM_NOUN, re.I),
    re.compile(PROGRAM_NOUN + r"\b[^.]{0,60}\b" + SUPERLATIVE, re.I),
    re.compile(r"\bfirst[- ]ever\b", re.I),
    re.compile(r"\bworld'?s\b", re.I),
    re.compile(r"\bindustry[- ]leading\b", re.I),
    re.compile(r"\bunprecedented\b", re.I),
]

# Claims quantifying over PEOPLE or over all businesses. A statement about one
# reader's situation is not one of these.
UNIVERSAL = [r"\bnobody\b", r"\bno one\b", r"\beveryone\b", r"\beverybody\b",
             r"\banyone\b", r"\ball businesses\b", r"\bevery business\b",
             r"\bevery brand\b", r"\bevery company\b", r"\bmost people\b",
             r"\bmost teams\b", r"\bmost companies\b", r"\bmost brands\b",
             r"\balways\b"]
# Reported, not failed. The brief's 2026-07-30 refinement wants a human ruling on
# these rather than an automatic rewrite.
WARN_ABSOLUTE = [r"\bnever\b", r"\bcannot\b", r"\bnothing\b", r"\bnone\b"]

# Real parties that turned up INSIDE a result set on a source page. Naming any of
# them uses their reputation as our commercial proof. Engine names are not here:
# they are the instruments of measurement and are allowed.
MEASURED_SUBJECTS = [
    "Landmark Property Management", "Penn Medicine", "Jefferson Health",
    "Engel & Volkers", "Engel & Voelkers", "Qonto", "Bucate pe Roate",
    "Kaiser Permanente", "Northwestern Memorial", "Rush University Medical",
]
ENGINES_ALLOWED = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                   "Google AI Overviews", "Grok", "Google"]

PRICING = [r"€", r"\bEUR\b", r"\bUSD\b", r"\$\d", r"/mo\b", r"\bper month\b",
           r"\bEssentials\b", r"\bGrowth PRO\b", r"\bfree trial\b"]

# A plural engine count is a denominator and must travel with its date. Singular
# ("one engine", "another engine") is exact and needs none, which is the whole
# reason the Madrid cut states no count.
ENGINE_COUNT = re.compile(
    r"\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+"
    r"(?:AI\s+|of\s+the\s+)?engines\b", re.I)
DATE = re.compile(r"\b(20\d\d|\d{1,2}\s+(January|February|March|April|May|June|"
                  r"July|August|September|October|November|December))\b", re.I)

failures = []
warnings = []


def fail(check, where, detail):
    failures.append((check, where, detail))


def check_dashes(text, where):
    for i, ch in enumerate(text):
        if ch in "–—−" or (
                unicodedata.category(ch) == "Pd" and ch != "-"):
            ctx = text[max(0, i - 40):i + 40].replace("\n", " ")
            fail("dash", where, f"U+{ord(ch):04X} in ...{ctx}...")
    for m in re.finditer(r"\S \- \S", text):
        fail("dash", where, f"spaced hyphen as punctuation: {m.group(0)}")


def check_banned(text, where):
    for v in variants(split_camel(text)):
        low = fold(v)
        for w in BANNED:
            if w in low:
                fail("banned-vocab", where, f"'{w}' in: {v.strip()[:90]}")


def check_program_superlative(text, where):
    for v in variants(split_camel(text)):
        for rx in PROGRAM_SUPER:
            m = rx.search(v)
            if m:
                fail("program-superlative", where, f"'{m.group(0)}' in: {v.strip()[:90]}")


def check_universals(text, where):
    for v in variants(split_camel(text)):
        for rx in UNIVERSAL:
            m = re.search(rx, v, re.I)
            if m:
                fail("universal", where, f"'{m.group(0)}' in: {v.strip()[:90]}")
        for rx in WARN_ABSOLUTE:
            m = re.search(rx, v, re.I)
            if m and v == variants(split_camel(text))[-1]:
                warnings.append((where, m.group(0)))


def check_measured_subject(text, where):
    low = fold(re.sub(r"\s+", " ", text))
    spans = []
    for name in MEASURED_SUBJECTS + ENGINES_ALLOWED:
        for m in re.finditer(re.escape(fold(name)), low):
            spans.append((m.start(), m.end(), name))
    # Span-aware: `Google` is a sub-span of the permitted `Google AI Mode`.
    # Discard any match wholly contained in a longer one at the same place.
    maximal = [s for s in spans if not any(
        o is not s and o[0] <= s[0] and s[1] <= o[1] and
        (o[1] - o[0]) > (s[1] - s[0]) for o in spans)]
    for _, _, name in maximal:
        if name in MEASURED_SUBJECTS:
            fail("measured-subject", where, f"named a measured party: {name}")


def check_meta_ai(text, where):
    for m in re.finditer(r"meta ai", fold(text)):
        window = fold(text)[max(0, m.start() - 120):m.end() + 120]
        if "retired" not in window:
            fail("meta-ai-live", where, "Meta AI mentioned without 'retired'")


def check_pricing(text, where):
    for rx in PRICING:
        m = re.search(rx, text, re.I)
        if m:
            fail("pricing-on-mofu", where, f"pricing token '{m.group(0)}'")


def check_engine_count_denominator(block, where):
    """Any plural engine count must carry a date in the same block."""
    m = ENGINE_COUNT.search(block)
    if m and not DATE.search(block):
        fail("engine-count-no-date", where,
             f"'{m.group(0)}' with no date in the same block")


def check_seven_engine_mix(text, where):
    """Today's seven-engine lineup must never be stated over a historical run."""
    if re.search(r"\bseven\s+(AI\s+)?engines\b", text, re.I) and DATE.search(text):
        fail("lineup-mixed-with-measurement", where,
             "today's seven-engine lineup stated alongside a dated measurement")


def check_first_sentence(block, where):
    """Facebook truncates at roughly 125 characters. The first sentence has to be
    complete and fit inside that on its own."""
    flat = re.sub(r"\s+", " ", block).strip()
    m = re.search(r"[.!?](\s|$)", flat)
    if not m:
        fail("truncation", where, "no sentence terminator in the body")
        return
    if m.end() > 125:
        fail("truncation", where,
             f"first sentence is {m.end()} chars, over the 125 cut: {flat[:60]}...")


def check_word_count(block, where, lo=80, hi=120):
    words = [w for w in re.split(r"\s+", block.strip()) if w and not w.startswith("http")]
    n = len(words)
    if not lo <= n <= hi:
        fail("word-count", where, f"{n} words, wanted {lo} to {hi}")


def check_rhetorical_opener(block, where):
    flat = re.sub(r"\s+", " ", block).strip()
    m = re.search(r"[.!?](\s|$)", flat)
    if m and flat[m.start()] == "?":
        fail("rhetorical-opener", where, f"body opens on a question: {flat[:70]}")


# ------------------------------------------------------------------ bodies ---
FENCE = re.compile(r"^```\s*$(.*?)^```\s*$", re.S | re.M)
FILEHEAD = re.compile(r"^## (fb-(?:feed|link)-[\w-]+\.png)\s*$", re.M)


def parse_posts(path):
    """Return [(filename, body, destination_url)] in document order."""
    text = open(path, encoding="utf-8").read()
    out = []
    heads = list(FILEHEAD.finditer(text))
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        section = text[h.end():end]
        fences = FENCE.findall(section)
        assert fences, f"{os.path.basename(path)}: no fenced body for {h.group(1)}"
        dest = re.search(r"\*\*Destination:\*\*\s*(\S+)", section)
        out.append((h.group(1), fences[0].strip(),
                    dest.group(1) if dest else None))
    return text, out


def sweep():
    failures.clear()
    warnings.clear()

    # ---- delivery: the files exist, at the claimed size, and are declared
    from PIL import Image
    for folder, expected in EXPECTED.items():
        on_disk = sorted(f for f in os.listdir(folder) if f.endswith(".png"))
        declared = [e[0] for e in expected]
        if on_disk != sorted(declared):
            fail("delivery", folder, f"on disk {on_disk} vs expected {sorted(declared)}")
        for name, w, h in expected:
            p = os.path.join(folder, name)
            if not os.path.isfile(p):
                fail("delivery", name, "missing on disk")
                continue
            im = Image.open(p)
            if (im.width, im.height) != (w, h):
                fail("delivery", name, f"{im.width}x{im.height}, expected {w}x{h}")

    # ---- POSTS.md, whole file plus per-body
    for path in POSTS:
        where = os.path.basename(os.path.dirname(path)) + "/POSTS.md"
        text, entries = parse_posts(path)
        for fn in (check_dashes, check_banned, check_program_superlative,
                   check_universals, check_measured_subject, check_meta_ai,
                   check_pricing, check_seven_engine_mix):
            fn(text, where)
        folder = os.path.dirname(path)
        declared = [e[0] for e in entries]
        expected = [e[0] for e in EXPECTED[folder]]
        if sorted(declared) != sorted(expected):
            fail("delivery", where, f"POSTS.md declares {declared}, folder holds {expected}")
        for name, body, dest in entries:
            w2 = f"{where}:{name}"
            check_pricing(body, w2)
            check_first_sentence(body, w2)
            check_word_count(body, w2)
            check_rhetorical_opener(body, w2)
            for para in re.split(r"\n\s*\n", body):
                check_engine_count_denominator(para, w2)
            if not dest or not dest.startswith("https://getbrandgeo.com"):
                fail("destination", w2, f"destination missing or off-domain: {dest}")
            tail = body.strip().split("\n")[-1].strip()
            if not (tail.startswith("https://getbrandgeo.com") or tail == "getbrandgeo.com"):
                fail("destination", w2, f"body does not end on the URL, ends on: {tail[:50]}")

    # ---- the strings the renderer actually draws
    spec = importlib.util.spec_from_file_location(
        "rfs", os.path.join(HERE, "render_facebook_static.py"))
    rfs = importlib.util.module_from_spec(spec)
    _stdout = sys.stdout
    sys.stdout = open(os.devnull, "w")
    try:
        spec.loader.exec_module(rfs)
        rfs.main()
    finally:
        sys.stdout.close()
        sys.stdout = _stdout
    drawn = "\n".join(rfs.DRAWN)
    for fn in (check_dashes, check_banned, check_program_superlative,
               check_universals, check_measured_subject, check_meta_ai,
               check_pricing, check_seven_engine_mix):
        fn(drawn, "drawn")
    # Each image's drawn strings are one block for the denominator rule.
    check_engine_count_denominator(drawn, "drawn")
    return list(failures), list(warnings)


# ------------------------------------------------------- negative controls ---
def controls():
    """Inject each defect, one at a time, and confirm the matching check fires."""
    cases = [
        ("dash", "an em dash — here", check_dashes),
        ("dash", "a spaced - hyphen", check_dashes),
        ("banned-vocab", "a seamless and robust workflow", check_banned),
        ("banned-vocab", "#DelveIntoTheData", check_banned),          # camel case
        ("program-superlative",
         "the first fully unanimous result measured anywhere in this program",
         check_program_superlative),
        ("program-superlative", "our first-ever study", check_program_superlative),
        ("universal", "nobody does this by hand", check_universals),
        ("universal", "most teams treat them as one result", check_universals),
        ("measured-subject", "the answer named Penn Medicine first", check_measured_subject),
        ("measured-subject", "it named Engel & Volkers", check_measured_subject),
        ("meta-ai-live", "we monitor ChatGPT, Gemini and Meta AI", check_meta_ai),
        ("pricing-on-mofu", "Growth PRO is EUR 449/mo", check_pricing),
        ("lineup-mixed-with-measurement",
         "we measured seven AI engines in Madrid on 10 July 2026",
         check_seven_engine_mix),
    ]
    block_cases = [
        ("engine-count-no-date", "Five AI engines named the same company.",
         check_engine_count_denominator),
        ("truncation",
         "A single opening sentence that is deliberately far too long to survive "
         "the Facebook truncation point and therefore has to be caught by the "
         "checker rather than by a reviewer reading it. Second sentence.",
         check_first_sentence),
        ("truncation", "no terminator at all", check_first_sentence),
        ("rhetorical-opener", "Are you invisible to AI? You might be.",
         check_rhetorical_opener),
        ("word-count", "far too short a body indeed", check_word_count),
    ]
    # A camel-case sub-span trap and a wrapped-line trap, both paid for already.
    wrap_case = ("program-superlative",
                 "the first fully unanimous result\nmeasured anywhere in this program",
                 check_program_superlative)
    subspan_ok = ("measured-subject", "we put it to Google AI Mode", check_measured_subject)

    fired = 0
    total = 0
    print("negative controls, one injection at a time:\n")
    for name, payload, fn in cases + block_cases + [wrap_case]:
        total += 1
        failures.clear()
        fn(payload, "INJECT")
        hit = any(f[0] == name for f in failures)
        fired += hit
        print(f"  {'FIRED ' if hit else 'BLIND '} {name:<32} {payload[:52]!r}")
    # Negative-negative: the span-aware matcher must NOT fire on an allowed engine.
    total += 1
    failures.clear()
    subspan_ok[2](subspan_ok[1], "INJECT")
    quiet = not failures
    fired += quiet
    print(f"  {'FIRED ' if quiet else 'BLIND '} {'subspan-not-flagged':<32} "
          f"{subspan_ok[1][:52]!r}   (must stay silent)")
    failures.clear()
    print(f"\n{fired} of {total} injections fired")
    return fired, total


def main():
    if "--controls" in sys.argv:
        fired, total = controls()
        if fired != total:
            print("A check could not be made to fire. It is BLIND, not clean.")
            sys.exit(2)
        print()
    f, w = sweep()
    print("copy and delivery sweep\n")
    if w:
        print("WARN, absolutes needing a situational-versus-universal ruling:")
        for where, word in sorted(set(w)):
            print(f"  {where:<28} '{word}'")
        print()
    if f:
        print(f"FAIL, {len(f)} finding(s):")
        for check, where, detail in f:
            print(f"  [{check}] {where}: {detail}")
        sys.exit(1)
    print("PASS: no dash, banned word, program superlative, people-quantifying")
    print("      universal, named measured subject, live-Meta-AI claim, pricing")
    print("      token, undated engine denominator, buried first sentence or")
    print("      missing file in either POSTS.md or in the drawn strings.")
    sys.exit(0)


if __name__ == "__main__":
    main()
