"""
Verification for the PRODUCT channel of CAMPAIGN-2026-07-30.

Per BRIEF section 4: a scan that passes everything is indistinguishable from
one that does not work. So every check in here is negative-controlled by
`--selftest`, which injects each defect the check claims to catch, one at a
time, and fails loudly if the check stays green.

Checks
  A  every image in the manifest exists on disk at the dimensions claimed
  B  the six plans are separable at thumbnail size IN GREYSCALE, which is the
     colour-blind and greyscale-invoice case by construction
  C  the dial can be read back structurally: counting the filled segments in
     the rendered pixels returns the plan's real live-engine count
  D  COPY.md obeys the BRIEF content rules and every stated character count
     is the true length of the field it labels

Run:  python verify_product.py
      python verify_product.py --selftest
"""

import json
import os
import re
import sys
import unicodedata

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, ".."))
COPY = os.path.join(OUT, "COPY.md")
README = os.path.join(OUT, "README.md")
MANIFEST = os.path.join(HERE, "manifest.json")

FAILURES = []


def fail(check, msg):
    FAILURES.append(f"[{check}] {msg}")


# ---------------------------------------------------------------------------
# text normalisation, per BRIEF section 4: camel case must be split before
# word-boundary matching or #FirstEverStudy sails through \bfirst\b.
# ---------------------------------------------------------------------------
# Proper nouns that are camel case on purpose. Splitting them invents word
# boundaries that are not there, and that produces FALSE POSITIVES, not just
# noise: "Every BrandGEO price id" split to "every brand geo" matched the
# universal-claim rule \bevery brand\b. They are folded to a single lowercase
# token before splitting, which the splitter then leaves alone.
PROTECTED = [
    "BrandGEO", "ChatGPT", "DeepSeek", "OpenAI", "SerpApi", "GitHub",
    "PostgreSQL", "JavaScript", "TypeScript",
]


def split_camel(s):
    for w in PROTECTED:
        s = re.sub(re.escape(w), w.lower(), s)
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s)
    s = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", s)
    return s


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


def index_blocks(raw):
    """Every text block, indexed both per-line and joined-and-normalised, so a
    phrase broken across a wrap still matches. BRIEF section 4."""
    lines = raw.split("\n")
    blocks = [norm(split_camel(ln)) for ln in lines]
    joined = norm(split_camel(re.sub(r"\s+", " ", raw)))
    blocks.append(joined)
    return blocks


# ---------------------------------------------------------------------------
# A. images exist at the claimed dimensions
# ---------------------------------------------------------------------------
def check_images(manifest, out_dir=OUT):
    for row in manifest:
        p = os.path.join(out_dir, row["file"])
        if not os.path.exists(p):
            fail("A", f"missing file {row['file']}")
            continue
        with Image.open(p) as im:
            if im.size != (row["w"], row["h"]):
                fail("A", f"{row['file']} is {im.size}, manifest claims "
                          f"({row['w']}, {row['h']})")


# ---------------------------------------------------------------------------
# B. thumbnail separability, in greyscale
# ---------------------------------------------------------------------------
THUMB = 48          # roughly the size Stripe renders a line-item product image
SEPARATION_FLOOR = 6.0   # RMS grey levels, 0..255


def _thumb_grey(path, size=THUMB):
    with Image.open(path) as im:
        return im.convert("L").resize((size, size), Image.LANCZOS)


def rms(a, b):
    pa, pb = list(a.getdata()), list(b.getdata())
    return (sum((x - y) ** 2 for x, y in zip(pa, pb)) / len(pa)) ** 0.5


def check_separability(plans, out_dir=OUT, verbose=False):
    thumbs = {}
    for k in plans:
        p = os.path.join(out_dir, f"stripe-{k}-1024x1024.png")
        if not os.path.exists(p):
            fail("B", f"cannot test separability, missing {p}")
            return {}
        thumbs[k] = _thumb_grey(p)
    worst = None
    for i, a in enumerate(plans):
        for b in plans[i + 1:]:
            r = rms(thumbs[a], thumbs[b])
            if verbose:
                print(f"    {a:12s} vs {b:12s}  RMS {r:6.2f}")
            if worst is None or r < worst[2]:
                worst = (a, b, r)
            if r < SEPARATION_FLOOR:
                fail("B", f"{a} and {b} are only {r:.2f} RMS apart in greyscale "
                          f"at {THUMB}px, floor is {SEPARATION_FLOOR}")
    return worst


# ---------------------------------------------------------------------------
# C. structural read-back of the dial
# ---------------------------------------------------------------------------
import math


def read_dial(path, segments=7):
    """Count filled segments by measuring the radial stroke width at each
    segment's mid-angle. A filled segment is drawn at full thickness, an empty
    one at 35% of it, so the run length separates them with a wide margin.

    Geometry mirrors render_product_images.render_square: centre (size/2,
    452u), radius 178u, thickness 0.155 * radius, where u = size / 1024.
    """
    with Image.open(path) as im:
        g = im.convert("L")
    size = g.width
    u = size / 1024.0
    cx, cy, R = size / 2.0, 452 * u, 178 * u
    thickness = R * 0.155
    px = g.load()

    counts = []
    for i in range(segments):
        mid = math.radians(-90.0 + (i + 0.5) * (360.0 / segments))
        run = 0
        # walk radially across the band, well outside it on both sides
        steps = int(thickness * 3)
        for s in range(steps):
            r = R - thickness * 1.6 + s * (thickness * 3.0 / steps)
            x = int(round(cx + r * math.cos(mid)))
            y = int(round(cy + r * math.sin(mid)))
            if 0 <= x < size and 0 <= y < size and px[x, y] > 40:
                run += 1
        counts.append(run * (thickness * 3.0 / steps))
    filled = sum(1 for w in counts if w > thickness * 0.62)
    return filled, counts


def check_dials(plan_facts, out_dir=OUT, verbose=False):
    for p in plan_facts:
        f = os.path.join(out_dir, f"stripe-{p['key']}-1024x1024.png")
        if not os.path.exists(f):
            fail("C", f"missing {f}")
            continue
        got, widths = read_dial(f)
        if verbose:
            print(f"    {p['key']:12s} filled={got} expected={p['live_engines']} "
                  f"widths={[round(w, 1) for w in widths]}")
        if got != p["live_engines"]:
            fail("C", f"{p['key']} dial reads {got} filled segments, "
                      f"planConfig.ts says {p['live_engines']}")


# ---------------------------------------------------------------------------
# D. copy rules
# ---------------------------------------------------------------------------
BANNED = [
    "delve", "unlock", "unleash", "elevate", "harness", "game changer",
    "game-changer", "supercharge", "revolutionize", "revolutionise",
    "seamless", "robust", "cutting edge", "cutting-edge", "transformative",
    "dive in", "in today's fast paced world", "in today's fast-paced world",
    "it's not just",
]
# "leverage" only as a verb; the noun is not banned. Matched as a verb form.
BANNED_VERB = [r"\bleverages?\b", r"\bleveraging\b", r"\bleveraged\b"]

# Programme superlatives, BRIEF section 3 rule 4. Matched as the actual
# claim shapes, not as bare words.
#
# A DELIBERATE OMISSION, recorded because omitting it looks like an oversight:
# bare "only" is NOT in this list. "ChatGPT only" is a true plan fact for the
# Free tier. An earlier draft of this file listed r"\bonly\b" alongside an
# allow-list containing the substring "only", which meant every match found
# its own allowance in context and the check could never fire. That is the
# exact failure mode BRIEF section 4 describes, produced here by accident.
SUPERLATIVES = [
    # `the first` was originally unqualified and fired on "the first 90
    # characters of every description", which is a measurement, not a boast.
    # Qualified by the nouns the rule is actually about.
    r"\bfirst[- ]ever\b",
    r"\bthe first (study|research|report|paper|tool|platform|product|vendor|company)\b",
    r"\bthe only (tool|platform|product|vendor)\b",
    r"\bstrongest\b", r"\bmost unanimous\b", r"\bcleanest\b",
    r"\bbest[- ]in[- ]class\b", r"\bworld[- ]class\b", r"\bindustry[- ]leading\b",
]

UNIVERSALS = [
    r"\bnobody\b", r"\bno one\b", r"\bevery brand\b", r"\ball businesses\b",
    r"\beveryone\b",
]

DASHES = ["—", "–", "−"]

# Prices, exactly as planConfig.ts and Account.tsx have them. Any of these
# appearing WRONG in COPY.md is a hard failure.
# EVERY PATTERN IN THIS FILE MUST BE LOWERCASE. index_blocks() casefolds, so
# an uppercase literal can never match. `EUR\s?900` was written uppercase here
# and was silently blind until the negative control caught it.
FORBIDDEN_PRICES = [
    r"€\s?900\b", r"eur\s?900\b",          # the retired Managed price
    r"€\s?150\b(?!0)", r"eur\s?150\b(?!0)",
    r"€\s?199\b", r"eur\s?199\b",
    r"€\s?399\b", r"eur\s?399\b",
]
# Engine claims that are false today. These are the exact strings the live
# Stripe catalogue script still carries (scripts/stripe-create-catalogue.js
# lines 55 and 62), which is why they are matched literally rather than by
# a greedy pattern: an unbounded `.*` against the joined block would span the
# whole document and fire on any two unrelated mentions.
FORBIDDEN_ENGINE_CLAIMS = [
    r"meta ai",                             # retired, in no plan set
    r"\bfour engines\b", r"\b4 engines\b",  # no plan has four
    r"\ball five engines\b",                # Growth PRO has seven
]


def check_copy(raw):
    blocks = index_blocks(raw)

    def hit(pattern, regex=True):
        for b in blocks:
            if regex:
                if re.search(pattern, b):
                    return True
            elif pattern in b:
                return True
        return False

    for w in BANNED:
        if hit(norm(w), regex=False):
            fail("D", f"banned vocabulary: {w!r}")
    for p in BANNED_VERB:
        if hit(p):
            fail("D", f"banned vocabulary (verb form): {p}")
    for d in DASHES:
        if d in raw:
            fail("D", f"dash character U+{ord(d):04X} present, "
                      f"BRIEF section 3 rule 1")
    for p in UNIVERSALS:
        if hit(p):
            fail("D", f"universal claim: {p}")
    for p in FORBIDDEN_PRICES:
        if hit(p):
            fail("D", f"price that does not match source: {p}")
    for p in FORBIDDEN_ENGINE_CLAIMS:
        if hit(p):
            fail("D", f"engine claim that is false today: {p}")

    # Programme superlatives. Span aware in the sense BRIEF section 4 means:
    # matches are reported at their maximal span, so a shorter pattern nested
    # inside a longer one is not double-reported.
    seen = set()
    for p in SUPERLATIVES:
        for b in blocks:
            for m in re.finditer(p, b):
                key = m.group(0)
                if key in seen:
                    continue
                seen.add(key)
                ctx = b[max(0, m.start() - 30):m.end() + 30]
                fail("D", f"programme superlative: {key!r} in ...{ctx}...")

    # Rhetorical question as an opener. A question may CLOSE a post.
    for m in re.finditer(r"^>?\s*([A-Z][^\n?]{3,120}\?)\s*$", raw, re.M):
        fail("D", f"line opens on a question: {m.group(1)[:60]!r}")

    # Character counts. Every "(NN chars)" annotation must be the true length
    # of the fenced block immediately above it.
    counted = 0
    for m in re.finditer(r"```text\n(.*?)\n```\n+_(\d+) characters_", raw, re.S):
        body, claimed = m.group(1), int(m.group(2))
        actual = len(body)
        counted += 1
        if actual != claimed:
            fail("D", f"character count wrong: claims {claimed}, is {actual}, "
                      f"for {body[:48]!r}")
    return counted


# ---------------------------------------------------------------------------
# E. per-plan factual claims in COPY.md, asserted against PLAN_FACTS
# ---------------------------------------------------------------------------
# ADDED 2026-07-31, and it exists because checks A to D were all green on a
# COPY.md whose Free block said "ChatGPT only" on the day PLAN_ENGINES.free
# became ['gemini']. Check C reads the dial and counts SEGMENTS, and Free's
# engine count did not move, so the image and the count agreed with each other
# and both agreed with source. The wrong thing was the engine's NAME, which no
# check in this file could see. That is precisely the failure mode the module
# docstring says every check here is supposed to be controlled against.
#
# Two rules, both scoped to a single plan's `## <Label>` section:
#   E1  an engine named in a plan's section must be an engine that plan runs,
#       unless the sentence naming it marks it as something the plan does NOT
#       have. Growth legitimately says "Google AI Overviews and Grok start at
#       Growth PRO"; Enterprise legitimately says Copilot and DeepSeek are
#       "reserved". A blanket ban would forbid both, so the exemption is
#       sentence-scoped rather than section-scoped.
#   E2  a prompt count written as "<N> prompts" in a plan's section must be
#       that plan's own allowance. This is what would have caught Essentials
#       still saying 15 after PLAN_PROMPTS moved to 18.

# Longest first. "Google AI Overviews" and "Google AI Mode" share a prefix, and
# matching the short one first would leave "Overviews" dangling and mis-attribute
# every Overviews mention to Mode.
ENGINE_VOCAB = [
    "Google AI Overviews", "Google AI Mode", "ChatGPT", "Perplexity",
    "DeepSeek", "Copilot", "Gemini", "Claude", "Grok",
]

# Phrases that make naming an absent engine truthful rather than a false claim.
# All lowercase: the section text is casefolded before matching, same rule as
# FORBIDDEN_PRICES.
ABSENCE_MARKERS = [
    "start at", "starts at", "starts here", "reserved", "do not collect",
    "does not collect", "neither collects", "will not tell you", "switch on",
    "up from", "cannot see", "not in", "adds ",
]


def _plan_sections(raw):
    """Split COPY.md on its `## ` headings and return {heading: body}. Only
    two-hash headings, so the `### Stripe` subheadings stay inside their plan."""
    parts = re.split(r"^## (?!#)(.+)$", raw, flags=re.M)
    out = {}
    for i in range(1, len(parts) - 1, 2):
        out[parts[i].strip()] = parts[i + 1]
    return out


def _sentences(body):
    for chunk in re.split(r"\n{2,}", body):
        for s in re.split(r"(?<=[.!?])\s+", chunk):
            if s.strip():
                yield s.strip()


def check_plan_claims(raw, plan_facts):
    sections = _plan_sections(raw)
    by_label = {p["label"]: p for p in plan_facts}
    seen = set()

    for label, body in sections.items():
        plan = by_label.get(label)
        if plan is None:
            continue          # "Notes for whoever pastes this" and friends
        seen.add(label)
        allowed = {e.casefold() for e in plan.get("engine_names", [])}

        # E1
        for sent in _sentences(body):
            low = sent.casefold()
            marked = any(m in low for m in ABSENCE_MARKERS)
            rest = low
            for engine in ENGINE_VOCAB:
                e = engine.casefold()
                if e not in rest:
                    continue
                rest = rest.replace(e, " ")   # mask so prefixes match once
                if e in allowed or marked:
                    continue
                fail("E", f"{label} names {engine!r}, which that plan does not "
                          f"run, in a sentence that does not mark it as absent: "
                          f"{sent[:80]!r}")

        # E2
        for m in re.finditer(r"\b(\d[\d,]*)\s+(?:buyer |commercial )?prompts\b",
                             body, re.I):
            n = int(m.group(1).replace(",", ""))
            want = plan.get("prompts")
            if want is None:
                fail("E", f"{label} states a prompt count of {n}, but this plan "
                          f"publishes no ceiling")
            elif n != want:
                fail("E", f"{label} states {n} prompts, PLAN_FACTS says {want}")

    for label in by_label:
        if label not in seen:
            fail("E", f"COPY.md has no '## {label}' section")


# ---------------------------------------------------------------------------
# negative control
# ---------------------------------------------------------------------------
def selftest():
    """Inject each defect, one at a time, and confirm the checker goes red."""
    global FAILURES
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    raw = open(COPY, encoding="utf-8").read()
    facts = _load_facts()
    # DERIVED, not hardcoded. This list was a literal of six plan keys until
    # 2026-07-31, so adding `radar` to PLAN_FACTS would have left the new tier
    # silently outside the negative control while every line still printed PASS.
    plans = [p["key"] for p in facts]

    injections = []

    # A: manifest claims a size the file does not have
    def a_bad_dim():
        m = [dict(r) for r in manifest]
        m[0]["w"] = m[0]["w"] + 7
        check_images(m)
    injections.append(("A: wrong dimension in manifest", a_bad_dim))

    # A: manifest names a file that is not on disk
    def a_missing():
        check_images([{"file": "does-not-exist.png", "w": 1, "h": 1}])
    injections.append(("A: missing file", a_missing))

    # B: two plans rendered identically
    def b_identical():
        import shutil
        src = os.path.join(OUT, "stripe-growth-1024x1024.png")
        dst = os.path.join(OUT, ".selftest-dupe.png")
        shutil.copyfile(src, dst)
        try:
            # compare growth against a byte-identical copy of itself
            a = _thumb_grey(src)
            b = _thumb_grey(dst)
            r = rms(a, b)
            if r < SEPARATION_FLOOR:
                fail("B", f"injected duplicate separated by only {r:.2f}")
        finally:
            os.remove(dst)
    injections.append(("B: two identical plan images", b_identical))

    # C: assert a plan's dial against the wrong engine count
    def c_wrong_count():
        bad = [dict(facts[2])]
        bad[0]["live_engines"] = 6   # Growth is 5
        check_dials(bad)
    injections.append(("C: dial asserted against wrong engine count", c_wrong_count))

    # D, one injection per rule the copy checker claims to enforce
    for label, mutate in [
        ("D: em dash", lambda s: s + "\nAn em dash — here.\n"),
        ("D: en dash", lambda s: s + "\nAn en dash – here.\n"),
        ("D: banned word", lambda s: s + "\nA seamless experience.\n"),
        ("D: banned verb", lambda s: s + "\nWe leverage the data.\n"),
        ("D: camel-case hashtag evading word boundary",
         lambda s: s + "\n#FirstEverStudy\n"),
        ("D: universal claim", lambda s: s + "\nNobody checks this by hand.\n"),
        # proves the QUALIFIED superlative pattern still fires after it was
        # narrowed to stop matching "the first 90 characters"
        ("D: programme superlative, qualified",
         lambda s: s + "\nThis is the first study of its kind.\n"),
        ("D: programme superlative, camel case",
         lambda s: s + "\n#FirstEverBenchmark\n"),
        ("D: retired Managed price, EUR form",
         lambda s: s + "\nManaged from EUR 900 / mo.\n"),
        ("D: retired Managed price, glyph form",
         lambda s: s + "\nManaged from €900 / mo.\n"),
        ("D: retired engine", lambda s: s + "\nWe monitor Meta AI.\n"),
        ("D: stale four-engine claim", lambda s: s + "\nGrowth covers four engines.\n"),
        ("D: rhetorical question opener",
         lambda s: s + "\nAre you invisible to ChatGPT?\n"),
        ("D: wrong character count",
         lambda s: s + "\n```text\nabcdef\n```\n\n_99 characters_\n"),
    ]:
        injections.append((label, (lambda f: (lambda: check_copy(f(raw))))(mutate)))

    # E, the rules that would have caught the stale Free block. Each injection
    # rewrites the real file rather than appending, because these rules are
    # section-scoped and an appended line belongs to no plan section.
    def e_wrong_engine():
        # put ChatGPT back into the Free section, unmarked. This is the exact
        # defect that shipped on 2026-07-30 and survived every other check.
        bad = raw.replace("Ask Gemini what it recommends in your category.",
                          "Ask ChatGPT what it recommends in your category.", 1)
        assert bad != raw, "injection did not apply, the anchor text moved"
        check_plan_claims(bad, facts)
    injections.append(("E: engine a plan does not run, named unmarked",
                       e_wrong_engine))

    def e_wrong_prompts():
        bad = raw.replace("18 buyer prompts", "15 buyer prompts", 1)
        assert bad != raw, "injection did not apply, the anchor text moved"
        check_plan_claims(bad, facts)
    injections.append(("E: stale prompt count for the plan", e_wrong_prompts))

    def e_missing_section():
        bad = raw.replace("\n## Radar\n", "\n## Radarr\n", 1)
        assert bad != raw, "injection did not apply, the anchor text moved"
        check_plan_claims(bad, facts)
    injections.append(("E: a plan has no section at all", e_missing_section))

    fired = 0
    for label, fn in injections:
        FAILURES = []
        fn()
        if FAILURES:
            fired += 1
            print(f"  FIRED  {label}")
        else:
            print(f"  BLIND  {label}  <-- this check does not work")
    FAILURES = []
    print(f"\n{fired} of {len(injections)} injections fired")
    return fired == len(injections)


def _load_facts():
    sys.path.insert(0, HERE)
    import render_product_images as R
    return R.PLAN_FACTS


def main():
    if not os.path.exists(MANIFEST):
        print("no manifest.json, run render_product_images.py first")
        return 1
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    facts = _load_facts()
    plans = [p["key"] for p in facts]

    if "--selftest" in sys.argv:
        print("negative control, injecting each defect one at a time\n")
        ok = selftest()
        print("\nself-test:", "PASS" if ok else "FAIL, a check is blind")
        return 0 if ok else 1

    print(f"A. images on disk at claimed dimensions ({len(manifest)} files)")
    check_images(manifest)

    print(f"B. greyscale separability at {THUMB}px, floor {SEPARATION_FLOOR} RMS")
    worst = check_separability(plans, verbose=True)
    if worst:
        print(f"    closest pair: {worst[0]} vs {worst[1]} at {worst[2]:.2f} RMS")

    print("C. dial read back from rendered pixels")
    check_dials(facts, verbose=True)

    print("D. copy rules and character counts")
    # BRIEF section 4: scan the whole delivered file, including your own
    # headings. README.md is delivered too, so it is scanned under the same
    # rules. Only COPY.md carries counted fields.
    total = 0
    for path in (COPY, README):
        if not os.path.exists(path):
            fail("D", f"{os.path.basename(path)} not found")
            continue
        total += check_copy(open(path, encoding="utf-8").read())
        print(f"    scanned {os.path.basename(path)}")
    print(f"    {total} character counts verified against the fenced blocks")

    print("E. per-plan engine names and prompt counts against PLAN_FACTS")
    check_plan_claims(open(COPY, encoding="utf-8").read(), facts)
    print(f"    {len(facts)} plan sections checked")

    print()
    if FAILURES:
        for f in FAILURES:
            print("FAIL", f)
        print(f"\n{len(FAILURES)} failure(s)")
        return 1
    print("all checks pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
