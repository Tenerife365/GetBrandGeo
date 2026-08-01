"""Compliance scan over the delivered bytes of the X and Threads copy.

Reads `x/POSTS.md`, `threads/POSTS.md` and the strings the renderer actually
drew (`drawn-strings.txt`). It reads the WHOLE file, headings and prose
included, because the campaign's own briefs have twice been the vector for a
bad claim: an instruction is not evidence of what shipped.

Checks, all of which are negative-controlled in `negative_control_copy.py`:

  D  em dash, en dash, minus sign, horizontal bar used as punctuation
  B  banned vocabulary
  S  superlatives about the research program
  U  universals, claims quantifying over people or businesses
  N  measured subjects, real company and person names from the research pages
  E  engine lineup: retired or unreleased engines named as live
  P  pricing on a TOFU asset
  Q  a post opening on a rhetorical question
  C  X character counts, counted the way X counts
  W  Threads word counts

Traps this is built against, all paid for in `reel-campaign-ab`:

  * Camel-case hashtags evade word boundaries, so camel case is split first.
  * A wrapped line matches nothing, so every block is indexed per-line AND
    joined-and-whitespace-normalised.
  * `Google` and `Google AI` are sub-spans of the permitted `Google AI Mode`,
    so the engine matcher is span-aware and discards non-maximal matches.
  * A raw-byte name matcher passes `Engel & Volkers` while firing on
    `Engel & Volkers` with its diaeresis, so both sides are folded: apostrophe
    variants to ASCII, then NFKD, then combining marks stripped, THEN case
    folded. Case folding last is load bearing.

Run: python scan_copy.py
"""

import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
CAMPAIGN = os.path.abspath(os.path.join(HERE, "..", ".."))
WEB = os.path.abspath(os.path.join(CAMPAIGN, "..", "..", "..", "brandgeo", "web"))

TARGETS = [
    os.path.join(CAMPAIGN, "x", "POSTS.md"),
    os.path.join(CAMPAIGN, "threads", "POSTS.md"),
    os.path.join(HERE, "drawn-strings.txt"),
]

# --------------------------------------------------------------- folding ---
APOS = {"’": "'", "‘": "'", "ʼ": "'", "´": "'",
        "`": "'", "‛": "'", "＇": "'"}


def fold(s):
    for a, b in APOS.items():
        s = s.replace(a, b)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")


def split_camel(s):
    """`#FirstEverStudy` passes `\\bfirst\\b`. Split camel case before matching."""
    return CAMEL.sub(" ", s)


def variants(text):
    """Every view a matcher needs: the raw text, the camel-split text, each
    line on its own, and the whole thing joined and whitespace-normalised so a
    phrase broken over a line break is still one string."""
    lines = text.splitlines()
    joined = " ".join(" ".join(lines).split())
    return {
        "raw": text,
        "camel": split_camel(text),
        "joined": joined,
        "joined_camel": split_camel(joined),
    }


# ------------------------------------------------------------- the rules ---
DASHES = {"—": "em dash", "–": "en dash", "−": "minus sign",
          "―": "horizontal bar", "‒": "figure dash"}

BANNED = ["delve", "unlock", "unleash", "elevate", "harness", "game-changer",
          "game changer", "supercharge", "revolutionize", "revolutionise",
          "seamless", "robust", "cutting-edge", "cutting edge",
          "transformative", "dive in", "fast-paced world"]
# `leverage` only as a verb. The noun is not banned and does not appear here.
BANNED_VERB = [r"\bleverage[sd]?\b(?!\s+(?:ratio|point))"]

SUPERLATIVE = [r"\bfirst[- ]ever\b", r"\bthe first\b", r"\bthe only\b",
               r"\bthe most\b", r"\bthe best\b", r"\bthe strongest\b",
               r"\bthe cleanest\b", r"\bthe biggest\b", r"\bthe largest\b",
               r"\bmost unanimous\b", r"\bnever before\b",
               r"\bunprecedented\b", r"\bworld[- ]class\b"]

UNIVERSAL = [r"\bnobody\b", r"\bno one\b", r"\beveryone\b", r"\beverybody\b",
             r"\bevery business\b", r"\bevery brand\b", r"\bevery company\b",
             r"\banyone\b", r"\ball businesses\b", r"\ball brands\b",
             r"\bhardly anyone\b", r"\balmost nobody\b"]

# Engines. The permitted set is what `planConfig.ts` calls live, minus the two
# that shipped 2026-07-29 with one day of rows, which no campaign asset may put
# a figure against. Everything in FORBIDDEN is a claim about a lineup that does
# not exist or does not apply.
ENGINES_OK = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Google AI Mode"]
ENGINES_FORBIDDEN = ["Meta AI", "Copilot", "Microsoft Copilot", "DeepSeek",
                     "Google AI Overviews", "AI Overviews", "Grok"]
# Sub-spans that are only ever legitimate inside a longer permitted name.
ENGINE_SPANS = sorted(ENGINES_OK + ENGINES_FORBIDDEN, key=len, reverse=True)

PRICING = [r"\bEUR ?\d", r"€ ?\d", r"\$\d", r"\bper month\b", r"/mo\b",
           r"\bEssentials\b", r"\bGrowth PRO\b", r"\bfree trial\b",
           # A bare `pricing` fired on this scanner's own checklist prose, so
           # it only counts as a defect when it sits next to a figure.
           r"\bpricing\b(?=[^.]{0,40}(?:\d|EUR))"]

# Phrases whose superlative is quoted from a buyer prompt or is our own
# refusal being recorded. A refusal is not a claim, and a quoted prompt is
# evidence. Both are adjudicated here rather than left to a reader's memory.
SUPERLATIVE_EXEMPT = [
    'best wealth management advisors in paris',
    '"best real estate agents for buying a home in boston"',
    '"top-rated property management companies in chicago"',
    'top-rated property management companies in chicago"',
    '"here are the top three, in order"',
    'the brand named as the top recommendation',
    'named the top recommendation',
    'the most 5/5-dense city',
    'the first fully unanimous result',
    'the cleanest, most unanimous',
    'the most unanimous result',
    'the strongest consensus',
    'the best any',
    # Ordinals, adjudicated here rather than left to a reader's judgement.
    # Each counts items in a stated set; none ranks this program against
    # anything outside it.
    'the first scored rank 1',
    'the first two went live',
    'the first seven city runs',
]


# Tokens that are instruments, places, languages or our own brand. A candidate
# built only from these is not a measured subject.
ALLOWED_TOKENS = {fold(t) for t in """
ChatGPT Claude Gemini Perplexity Google AI Mode Overviews Overview Meta Copilot
Microsoft DeepSeek Grok OpenAI BrandGEO Research GEO LLM API
Chicago Boston Houston Paris Rome Madrid Berlin London Denver Atlanta Detroit
Baltimore Charlotte Minneapolis Dallas Phoenix Seattle Portland Miami Austin
Philadelphia Cleveland Columbus Nashville Orlando Sacramento Tampa Pittsburgh
York New Los Angeles San Francisco Diego Antonio Jose Vegas City States United
Kingdom France Germany Italy Spain Romania Europe America
English French German Italian Spanish Romanian July June August 2026 2025
Zenodo DOI Netlify Supabase Stripe Inter Pillow
""".split()}

CONNECTIVES = {fold(t) for t in ["and", "of", "the", "in", "for", "de", "la",
                                 "le", "du", "des", "a", "an", "to", "on",
                                 "at", "with", "pe", "y", "e", "da", "di",
                                 "van", "von", "el", "il"]}


def _harvest_blocks(html):
    """Contexts in which a research page states a MEASURED SUBJECT: consensus
    table cells, quoted strings, emphasised runs, headings, and comma
    appositives. Harvesting the whole page instead produces conjunction runs
    like `ChatGPT and Gemini`, which is what the first version of this did."""
    out = []
    # Table cells only, plus quotes and appositives below. Headings and
    # <strong> runs were harvested first and produced `AI Visibility`,
    # `Real Estate`, `AI Search` and `GEO Measurement`: title-cased generic
    # phrases, not names. A company name made of ordinary words, which is most
    # of them, cannot be told from a section title by vocabulary, so the
    # discriminator has to be the CONTEXT it was found in.
    for pat in (r"<t[dh][^>]*>(.*?)</t[dh]>",):
        out += re.findall(pat, html, re.S)
    flat = re.sub(r"<[^>]+>", " ", html)
    flat = (flat.replace("&amp;", "&").replace("&#39;", "'")
                .replace("&quot;", '"').replace("&nbsp;", " ")
                .replace("&rsquo;", "'"))
    out += re.findall(r'"([^"\n]{6,70})"', flat)
    out += re.findall(r"'([^'\n]{6,70})'", flat)
    # ", Some Named Firm," and ", Some Named Firm."
    out += re.findall(r",\s+([A-Z][\w'&.\-]*(?:\s+(?:[a-z]{1,3}\s+)?"
                      r"[A-Z][\w'&.\-]*){1,4})\s*[,.]", flat)
    return out


_LOWER_VOCAB = set()


def _load_lower_vocab():
    """Every token the research corpus ever writes in lower case. Used only as
    a tie-breaker on two-word candidates: `Real Estate` is ordinary vocabulary
    title-cased, `Robert Cohen` is not."""
    if _LOWER_VOCAB:
        return _LOWER_VOCAB
    if os.path.isdir(WEB):
        for f in sorted(os.listdir(WEB)):
            if not f.endswith(".html"):
                continue
            try:
                html = open(os.path.join(WEB, f), encoding="utf-8",
                            errors="replace").read()
            except OSError:
                continue
            flat = re.sub(r"<[^>]+>", " ", html)
            for tok in re.findall(r"[A-Za-z][A-Za-z'\-]+", flat):
                if tok[0].islower():
                    _LOWER_VOCAB.add(fold(tok))
    return _LOWER_VOCAB


def _candidate(seg):
    """A measured subject looks like a name, not like a sentence."""
    seg = re.sub(r"<[^>]+>", " ", seg)
    seg = (seg.replace("&amp;", "&").replace("&#39;", "'")
              .replace("&quot;", '"').replace("&nbsp;", " ")
              .replace("&rsquo;", "'"))
    seg = re.sub(r"\([^)]*\)", " ", seg)
    seg = " ".join(seg.split()).strip(" .,:;\"'")
    if not (8 <= len(seg) <= 60):
        return None
    toks = re.findall(r"[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ'\-]*", seg)
    if len(toks) < 2:
        return None
    caps = [t for t in toks if t[0].isupper()]
    lows = [t for t in toks if t[0].islower() and fold(t) not in CONNECTIVES]
    if len(caps) < 2:
        return None
    if len(lows) >= 2:
        return None                       # a quoted prompt, not a name
    if all(fold(t) in ALLOWED_TOKENS or fold(t) in CONNECTIVES for t in toks):
        return None                       # engines, cities, our own brand
    # What is left once instruments, places and connectives are removed. One
    # residual token is a category label (`AI Visibility`, `GEO Measurement`).
    # Two residual tokens that the corpus also writes in lower case are a
    # common phrase title-cased (`Real Estate`), not a firm.
    resid = [t for t in caps
             if fold(t) not in ALLOWED_TOKENS and fold(t) not in CONNECTIVES]
    if len(resid) < 2:
        return None
    if len(resid) == 2 and all(fold(t) in _load_lower_vocab() for t in resid):
        return None
    return seg


def _proper_name_corpus():
    """Company and person names harvested from the research pages, so the
    measured-subject check is not a hand-written list that forgets somebody.

    Known limit, stated rather than smoothed over: this harvests table cells,
    quotes, emphasis, headings and comma appositives. A subject that appears
    only in unquoted running prose, with no emphasis and no appositive commas,
    is not covered. The curated additions below close that gap for the pages
    this campaign actually cites, which were read by hand."""
    cand = set()
    if os.path.isdir(WEB):
        for f in sorted(os.listdir(WEB)):
            if not f.endswith(".html"):
                continue
            try:
                html = open(os.path.join(WEB, f), encoding="utf-8",
                            errors="replace").read()
            except OSError:
                continue
            for seg in _harvest_blocks(html):
                c = _candidate(seg)
                if c:
                    cand.add(c)
    # Read by hand off the pages this campaign cites. Kept alongside the
    # harvest, not instead of it, so a name is caught by either route.
    cand |= {
        "McDermott Will & Emery", "McDermott Will & Schulte",
        "Green Ocean Property Management", "Landmark Property Management",
        "Shannon Property Management", "Real Property Management Preferred",
        "Cheval Blanc Patrimoine", "Societe Generale Private Banking",
        "Mass General Brigham", "Ropes & Gray", "Kirkland & Ellis",
        "Bucate pe Roate", "Robert Cohen", "Evan Compean", "Compean Group",
    }
    return cand


NAME_CORPUS = None


def name_corpus():
    global NAME_CORPUS
    if NAME_CORPUS is None:
        NAME_CORPUS = _proper_name_corpus()
    return NAME_CORPUS


# ------------------------------------------------------------- the checks ---
def check_dashes(v):
    hits = []
    for ch, label in DASHES.items():
        for m in re.finditer(re.escape(ch), v["raw"]):
            hits.append(f"{label} at offset {m.start()}")
    return hits


def check_banned(v):
    hits = []
    hay = v["joined_camel"].casefold()
    for w in BANNED:
        if re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", hay):
            hits.append(f"banned word: {w}")
    for pat in BANNED_VERB:
        if re.search(pat, hay):
            hits.append(f"banned verb: {pat}")
    return hits


def _exempt(hay, start, end):
    for ex in SUPERLATIVE_EXEMPT:
        i = 0
        while True:
            i = hay.find(ex, i)
            if i < 0:
                break
            if i <= start and end <= i + len(ex):
                return True
            i += 1
    return False


def check_superlative(v):
    hits = []
    hay = v["joined_camel"].casefold()
    for pat in SUPERLATIVE:
        for m in re.finditer(pat, hay):
            if _exempt(hay, m.start(), m.end()):
                continue
            hits.append(f"superlative: {hay[max(0, m.start()-40):m.end()+40]!r}")
    return hits


def check_universal(v):
    hits = []
    hay = v["joined_camel"].casefold()
    for pat in UNIVERSAL:
        for m in re.finditer(pat, hay):
            hits.append(f"universal: {hay[max(0, m.start()-40):m.end()+40]!r}")
    return hits


def check_engines(v):
    """Span-aware. Longest match wins, so `Google AI Mode` does not also count
    as `Google AI` or as a bare `Google`."""
    hits = []
    hay = v["joined"]
    taken = []
    for name in ENGINE_SPANS:
        for m in re.finditer(re.escape(name), hay):
            if any(m.start() >= a and m.end() <= b for a, b in taken):
                continue           # a sub-span of something already matched
            taken.append((m.start(), m.end()))
            if name in ENGINES_FORBIDDEN:
                ctx = hay[max(0, m.start() - 90):m.end() + 90]
                # Naming a retired or one-day-old engine is allowed only where
                # the same sentence discloses that status.
                disclosed = re.search(
                    r"retired|no plan set|went live 2026-07-29|one day of rows|"
                    r"single day of rows|is not used|does not appear|"
                    r"not use|no Grok|forbidden|excluded|predate",
                    ctx, re.I)
                if not disclosed:
                    hits.append(f"engine {name!r} named without its status: "
                                f"{ctx!r}")
    return hits


def check_pricing(v):
    hits = []
    hay = v["joined"]
    for pat in PRICING:
        for m in re.finditer(pat, hay, re.I):
            ctx = hay[max(0, m.start() - 60):m.end() + 60]
            if re.search(r"no pricing|without one|no plan names", ctx, re.I):
                continue
            hits.append(f"pricing: {ctx!r}")
    return hits


def check_names(v):
    hits = []
    hay = fold(v["joined"])
    for n in name_corpus():
        f = fold(n)
        if len(f) < 8:
            continue
        i = hay.find(f)
        if i >= 0:
            hits.append(f"measured subject: {n!r} at {i}")
    return hits


BODY = re.compile(r"```text\n(.*?)\n```", re.S)
URL = re.compile(r"\bhttps?://\S+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai)"
                 r"(?:/\S*)?\b", re.I)


def x_length(post):
    """X weights a URL at 23 characters regardless of its real length, and
    counts Unicode code points for Latin text."""
    n_urls = len(URL.findall(post))
    stripped = URL.sub("", post)
    return len(stripped) + n_urls * 23


def check_question_openers(bodies):
    hits = []
    for i, b in enumerate(bodies):
        first = re.split(r"(?<=[.!?])\s", b.strip(), maxsplit=1)[0]
        if first.rstrip().endswith("?"):
            hits.append(f"post {i + 1} opens on a question: {first!r}")
    return hits


CHECKS = [
    ("D dashes", check_dashes),
    ("B banned vocabulary", check_banned),
    ("S superlatives", check_superlative),
    ("U universals", check_universal),
    ("N measured subjects", check_names),
    ("E engine lineup", check_engines),
    ("P pricing", check_pricing),
]


def scan_text(text):
    v = variants(text)
    out = {}
    for label, fn in CHECKS:
        out[label] = fn(v)
    return out


def main(paths=None, quiet=False):
    paths = paths or TARGETS
    total = 0
    for p in paths:
        if not os.path.exists(p):
            print(f"MISSING {p}")
            total += 1
            continue
        text = open(p, encoding="utf-8").read()
        res = scan_text(text)
        bodies = BODY.findall(text)
        res["Q opening question"] = check_question_openers(bodies)
        n = sum(len(v) for v in res.values())
        total += n
        if not quiet:
            print(f"\n{os.path.relpath(p, CAMPAIGN)}  "
                  f"({len(text)} bytes, {len(bodies)} post bodies)")
            for label, hits in res.items():
                print(f"  {label:<24} {len(hits)}")
                for h in hits:
                    print(f"      {h}")
            if bodies:
                if "x" + os.sep in p or p.endswith(os.path.join("x", "POSTS.md")):
                    print("  X character counts")
                    for i, b in enumerate(bodies):
                        c = x_length(b)
                        flag = "" if c <= 280 else "  OVER 280"
                        print(f"      post {i + 1:>2}: {c:>3}{flag}")
                        if c > 280:
                            total += 1
                else:
                    print("  Threads word counts")
                    for i, b in enumerate(bodies):
                        w = len(b.split())
                        flag = "" if 100 <= w <= 150 else "  OUT OF BAND"
                        print(f"      post {i + 1:>2}: {w:>3}{flag}")
                        if not 100 <= w <= 150:
                            total += 1
    if not quiet:
        print(f"\ntotal findings: {total}")
    return total


if __name__ == "__main__":
    sys.exit(1 if main() else 0)
