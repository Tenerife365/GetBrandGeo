"""
Compliance scan for the LinkedIn channel of CAMPAIGN-2026-07-30.

Runs on DELIVERED BYTES: the whole of `POSTS.md` including its own headings, and
`drawn_strings.json`, which the renderer writes from inside its own `text()`
call, so it is what was actually put on a canvas rather than a table that could
drift from the render.

Every check is negative-controlled. `python scan_linkedin.py --control` injects
each defect one at a time, confirms the check goes red, restores, and re-runs
clean. A check that cannot be made to fire is blind and is reported as blind.

  python scan_linkedin.py            scan, exit non-zero on any finding
  python scan_linkedin.py --control  negative-control every check, then scan

Traps this is written against, each of which has cost this campaign a real
defect somewhere:

  * camel-case hashtags evade word boundaries, so `#FirstEverStudy` is split
    before matching;
  * a wrapped line matches nothing, so every block is indexed per-line AND
    joined-and-whitespace-normalised;
  * `Google` and `Google AI` are sub-spans of the permitted `Google AI Mode`, so
    the engine matcher is span-aware and discards non-maximal matches;
  * a name scanner matching raw bytes passes `Engel & Volkers` while firing on
    `Engel & Volkers` with its diacritic, so both sides are NFKD-folded, stripped
    of combining marks, then case-folded, in that order.
"""

import glob
import html
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
LI = os.path.abspath(os.path.join(HERE, ".."))
REPO = os.path.abspath(os.path.join(LI, "..", "..", "..", ".."))
POSTS = os.path.join(LI, "POSTS.md")
DRAWN = os.path.join(HERE, "drawn_strings.json")
WEB = os.path.join(REPO, "brandgeo", "web")

FINDINGS = []


def finding(check, where, detail):
    FINDINGS.append((check, where, detail))


# ------------------------------------------------------------ normalising ---
def fold(s):
    """NFKD, strip combining marks, then case-fold, in that order. Case-folding
    first lets an upper-cased accented form through, which is the whole bug."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"')
    # German and Nordic forms normalisation does not reach
    s = (s.replace("ß", "ss").replace("œ", "oe").replace("æ", "ae")
          .replace("ø", "o").replace("Ł", "l").replace("ł", "l"))
    return s.casefold()


CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")


def split_camel(s):
    """`#FirstEverStudy` -> `# First Ever Study`, so word-boundary patterns see
    the words. Applied to the whole text, not just to hashtags: a check that
    only looks inside `#...` misses `FirstEverStudy` written without one."""
    return CAMEL.sub(" ", s)


def views(raw):
    """Three views of the same text. A defect that survives all three is not
    hiding in line wrapping or in camel case."""
    lines = raw.split("\n")
    joined = re.sub(r"\s+", " ", raw)
    return {
        "lines": [(i + 1, ln) for i, ln in enumerate(lines)],
        "joined": joined,
        "camel": split_camel(joined),
        # BOTH folded views, and this is not belt and braces.
        # `split_camel` turns `McDermott` into `Mc Dermott`, so a haystack that
        # has only been camel-split cannot match a real name carrying an
        # internal capital. The control caught this: injecting
        # `McDermott Will & Emery` passed clean while the all-lower-case form
        # fired, which is backwards. A defence against camel-case hashtags had
        # opened a hole for exactly the names the check exists to catch.
        "folded": fold(joined),
        "folded_camel": fold(split_camel(joined)),
    }


# ------------------------------------------------------------- the corpus ---
_names = None


def measured_subjects():
    """Company and firm names harvested from the published research pages.

    A capitalised token is treated as proper-noun-ish only if the corpus never
    uses it lower case. That oracle is what stops `Wealth`, `Asked` and
    `Coverage` being reported as companies, a false-positive class that in an
    earlier run masked two real harvester bugs.
    """
    global _names
    if _names is not None:
        return _names
    files = sorted(glob.glob(os.path.join(WEB, "ai-visibility-for-*.html")))
    corpus, lowered = [], set()
    for p in files:
        t = open(p, encoding="utf-8").read()
        t = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", t)
        t = html.unescape(re.sub(r"<[^>]+>", " ", t))
        corpus.append(t)
        for w in re.findall(r"[A-Za-z][A-Za-z'\-]+", t):
            if w.islower():
                lowered.add(w)
    joined = "\n".join(corpus)

    # Candidate spans: 2 to 6 capitalised words, ampersands and commas allowed
    # inside, never crossing a newline. `\s+` crossing newlines is how an earlier
    # harvester fabricated names like "Common Questions Does".
    tok = r"[A-Z][A-Za-zÀ-ɏ'’\-\.]*"
    pat = re.compile(r"\b%s(?:[ ]{1,2}(?:&|and|of|for|the|de|la|di|du)?[ ]{0,2}%s){1,5}\b"
                     % (tok, tok))
    stop = {"ai", "the", "a", "of", "and", "in", "for", "to", "is", "what", "how",
            "why", "does", "did", "which", "who", "our", "we", "you", "your",
            "this", "that", "it", "brandgeo", "getbrandgeo", "chatgpt", "gemini",
            "claude", "perplexity", "google", "meta", "grok", "copilot",
            "deepseek", "openai", "anthropic", "microsoft", "reddit",
            # engine name parts. An ENGINE is an instrument, not a measured
            # subject, and the campaign rules permit naming it. Without these,
            # `Google AI Overviews` harvests as a company and the scan fails on
            # correct copy, which is how a checker gets loosened until it is
            # useless.
            "overview", "overviews", "mode"}
    # Capitalised words that are never a company on their own: languages,
    # demonyms, months, weekdays, the cities in the program, and the words our
    # own headings capitalise. Without this, `French and English` harvests as a
    # firm, which it did on the first run of this scanner.
    generic = {
        "english", "french", "german", "italian", "spanish", "romanian", "dutch",
        "portuguese", "irish", "american", "british", "european", "us", "uk",
        "january", "february", "march", "april", "may", "june", "july", "august",
        "september", "october", "november", "december", "monday", "tuesday",
        "wednesday", "thursday", "friday", "saturday", "sunday",
        "research", "program", "visibility", "engine", "engines", "prompt",
        "prompts", "answer", "answers", "city", "cities", "category",
        "categories", "consensus", "data", "add", "faq", "faqpage", "schema",
        "json", "ld", "webpage", "organization", "localbusiness", "question",
        "questions", "original", "pipeline", "own", "shows", "key", "findings",
    }
    for p in files:
        slug = os.path.basename(p)[len("ai-visibility-for-"):-len(".html")]
        for part in re.findall(r"[a-z]+", slug):
            generic.add(part)
        generic.add(slug)
    generic |= {"san", "antonio", "diego", "francisco", "los", "angeles", "new",
                "york", "washington", "dc", "united", "states", "joint", "base"}

    def clean(w):
        return re.sub(r"[^A-Za-z'\-]", "", w).lower()

    names = set()
    for m in pat.finditer(joined):
        span = m.group(0).strip(" .")
        words = [w for w in re.split(r"[ ]+", span) if w]
        core = [w for w in words if clean(w) not in
                {"", "and", "of", "for", "the", "de", "la", "di", "du"}]
        if len(core) < 2:
            continue
        # AT LEAST ONE core token must be a word the corpus never writes lower
        # case and that is not generic. Requiring ALL of them was the earlier
        # rule and it dropped `McDermott Will & Emery`, because `will` appears
        # lower case, so a real name walked straight through a 200 name corpus.
        # A false positive here is visible and costs a re-read. A false negative
        # ships someone's name in an advert.
        qualifying = [w for w in core
                      if clean(w) and clean(w) not in lowered
                      and clean(w) not in stop and clean(w) not in generic]
        if not qualifying:
            continue
        if len(fold(span)) < 8:
            continue
        # belt and braces: never treat a span that is part of a permitted engine
        # name as a measured subject
        if any(fold(span) in fold(e) for e in
               ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                "Grok", "Google AI Overviews", "Meta AI"]):
            continue
        names.add(span)
    _names = sorted(names)
    return _names


# ----------------------------------------------------------------- checks ---
DASHES = {"—": "em dash", "–": "en dash", "−": "minus sign",
          "‒": "figure dash", "―": "horizontal bar"}

BANNED = ["delve", "unlock", "unleash", "elevate", "harness", "game-changer",
          "game changer", "supercharge", "revolutionize", "revolutionise",
          "seamless", "robust", "cutting-edge", "cutting edge", "transformative",
          "dive in", "in today's fast-paced world", "it's not just"]
BANNED_VERB = re.compile(r"\b(leverage|leveraging|leverages|leveraged)\b", re.I)

# A superlative is only a defect when it is a claim about the research program.
# Bare "most" in "most of the time" is not. Proximity is what makes it one.
SUPER = (r"\b(first|only|best|biggest|strongest|cleanest|clearest|widest|"
         r"largest|densest|most)\b")
PROGRAM = (r"(research program|this program|our program|any city|anywhere|"
           r"ever (?:measured|recorded|seen)|of all (?:the )?(?:cities|pages))")

# Universals: the test is whether it QUANTIFIES OVER PEOPLE, not whether the
# word appears. Reported for adjudication rather than auto-failed, except the
# unambiguous forms.
UNIVERSAL_HARD = [
    r"\bnobody\b", r"\bno one\b", r"\beveryone\b", r"\beverybody\b",
    r"\bevery (?:business|brand|company|marketer|founder|person)\b",
    r"\banyone (?:can|will|does|knows)\b",
]
UNIVERSAL_SOFT = [r"\bnever\b", r"\balways\b", r"\bcannot\b", r"\bevery\b",
                  r"\bany\b", r"\bno one\b"]

LIVE_ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                "Grok", "Google AI Overviews"]
RETIRED = ["Meta AI", "Meta"]
NOT_LIVE = ["Copilot", "DeepSeek"]


def check_dashes(name, v):
    for ln, line in v["lines"]:
        for ch, label in DASHES.items():
            if ch in line:
                finding("dash", "%s:%d" % (name, ln), "%s in %r" % (label, line.strip()[:70]))


def check_banned(name, v):
    """Both views, for the same reason check_measured_subjects uses both."""
    seen = set()
    for view in (v["joined"], v["camel"]):
        low = view.lower()
        for w in BANNED:
            if w in low and w not in seen:
                seen.add(w)
                finding("banned-vocab", name, "%r" % w)
        for m in BANNED_VERB.finditer(view):
            k = "verb:" + m.group(0).lower()
            if k not in seen:
                seen.add(k)
                finding("banned-vocab", name, "leverage as a verb: %r" % m.group(0))


def check_question_opener(name, blocks):
    """No rhetorical question as an OPENER. A question may close a post."""
    for label, body in blocks:
        first = body.strip().split("\n")[0].strip()
        if first.endswith("?"):
            finding("question-opener", "%s/%s" % (name, label),
                    "opens on a question: %r" % first[:80])


def check_superlative(name, v):
    seen = set()
    for view in (v["joined"], v["camel"]):
        for m in re.finditer(SUPER, view, re.I):
            window = view[max(0, m.start() - 110):m.end() + 110]
            if re.search(PROGRAM, window, re.I):
                k = (m.group(0).lower(), re.sub(r"\s+", " ", window)[:60])
                if k in seen:
                    continue
                seen.add(k)
                finding("program-superlative", name,
                        "%r near a program-scope phrase: ...%s..."
                        % (m.group(0), re.sub(r"\s+", " ", window)[:120]))


def check_universals(name, v):
    for pat in UNIVERSAL_HARD:
        for m in re.finditer(pat, v["camel"], re.I):
            finding("universal", name, "quantifies over people: %r" % m.group(0))
    soft = []
    for pat in UNIVERSAL_SOFT:
        soft += [m.group(0) for m in re.finditer(pat, v["camel"], re.I)]
    return soft


def spans_permitted(text_):
    """Span-aware engine matching. Longest match wins, so `Google AI Overviews`
    is not reported as a bare `Google`, and `Meta AI` is not missed because
    `Meta` matched first."""
    terms = sorted(LIVE_ENGINES + RETIRED + NOT_LIVE, key=len, reverse=True)
    found, taken = [], []
    for t in terms:
        for m in re.finditer(re.escape(t), text_):
            if any(m.start() < b and m.end() > a for a, b in taken):
                continue          # non-maximal, a longer term already claimed it
            taken.append((m.start(), m.end()))
            found.append((t, m.start()))
    return found


def check_engines(name, v):
    for term, pos in spans_permitted(v["joined"]):
        window = v["joined"][max(0, pos - 160):pos + 160]
        if term in RETIRED:
            if not re.search(r"retired|no longer|since been", window, re.I):
                finding("retired-engine", name,
                        "%r without a retirement disclosure in the same window" % term)
        if term in NOT_LIVE and not re.search(
                r"no purchasable plan|not live|coming soon|no plan|rejected|"
                r"corpus defect|never collect", window, re.I):
            finding("not-live-engine", name,
                    "%r without a disavowal in the same window" % term)
    for m in re.finditer(r"(?:monitor|monitors|run|runs|across)\s+"
                         r"(one|two|three|four|five|six|seven|eight|\d+)\s+engines",
                         v["joined"], re.I):
        window = v["joined"][max(0, m.start() - 120):m.end() + 120]
        historical = re.search(r"20\d\d-\d\d-\d\d|that run|that day|collected|predates",
                               window, re.I)
        if not historical and m.group(1).lower() not in ("seven", "7"):
            finding("engine-count", name,
                    "present-tense lineup stated as %r, today's is seven" % m.group(1))


def check_measured_subjects(name, v):
    """Two haystacks against two needle forms. Any of the four combinations
    firing is a hit:

      plain needle  in plain haystack     `McDermott Will & Emery`
      plain needle  in camel haystack     a name with no internal capitals
      camel needle  in camel haystack     `#McDermottWillEmery`
      camel needle  in plain haystack     defensive

    Three of the four are redundant most of the time. The one that is not is
    what the control found blind.
    """
    hays = (v["folded"], v["folded_camel"])
    for n in measured_subjects():
        for f in (fold(n), fold(split_camel(n))):
            if len(f) < 8:
                continue
            if any(f in h for h in hays):
                finding("measured-subject", name, "names %r" % n)
                break


def check_word_counts(blocks):
    for label, body in blocks:
        n = len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-\./]*", body))
        if not (180 <= n <= 260):
            finding("word-count", label, "%d words, band is 180 to 260" % n)


def check_prefold(raw):
    """The claimed pre-fold length must equal the measured one, and must fit
    inside the roughly 210 characters LinkedIn shows before "see more".

    Claimed numbers written by hand were wrong on all four posts on the first
    pass, by between 2 and 12 characters, which is why this is a check and not
    a note.
    """
    for m in re.finditer(r"^## (Post \d[^\n]*)\n(.*?)(?=^---$|\Z)", raw, re.S | re.M):
        label, chunk = m.group(1), m.group(2)
        claimed = re.search(r"\*\*Pre-fold opening:\*\* (\d+) characters", chunk)
        body = re.split(r"\*\*Pre-fold opening:\*\*[^\n]*\n", chunk)[-1].strip()
        first = re.sub(r"\s+", " ", re.split(r"\n\s*\n", body)[0]).strip()
        if not claimed:
            finding("prefold", label, "no pre-fold length declared")
            continue
        if int(claimed.group(1)) != len(first):
            finding("prefold", label, "claims %s characters, measures %d"
                    % (claimed.group(1), len(first)))
        if len(first) > 210:
            finding("prefold", label,
                    "%d characters, past the roughly 210 LinkedIn shows before "
                    "\"see more\"" % len(first))


def check_images():
    from PIL import Image
    raw = open(POSTS, encoding="utf-8").read()
    refs = set(re.findall(r"[\w/\-]+\.png", raw))
    if not refs:
        finding("image-refs", "POSTS.md", "no image filenames referenced at all")
    for r in sorted(refs):
        p = os.path.join(LI, r)
        if not os.path.exists(p):
            finding("image-missing", r, "referenced in POSTS.md, not on disk")
            continue
        m = re.search(r"(\d{3,4})x(\d{3,4})\.png$", r)
        im = Image.open(p)
        if m and (im.width, im.height) != (int(m.group(1)), int(m.group(2))):
            finding("image-size", r, "filename claims %sx%s, file is %dx%d"
                    % (m.group(1), m.group(2), im.width, im.height))
    # and the reverse: anything on disk that POSTS.md never names
    for p in sorted(glob.glob(os.path.join(LI, "feed", "*.png")) +
                    glob.glob(os.path.join(LI, "carousel", "*.png"))):
        rel = os.path.relpath(p, LI).replace("\\", "/")
        if rel not in refs:
            finding("image-orphan", rel, "on disk, not referenced in POSTS.md")
    return sorted(refs)


# --------------------------------------------------------------- the scan ---
def post_blocks(raw):
    """The four publishable post bodies, sliced out of POSTS.md.

    Bounded by the last metadata line of each post section and the Source line,
    so the surrounding editorial prose is not counted as post copy. The FULL
    file is still scanned separately, headings included.
    """
    out = []
    for m in re.finditer(r"^## (Post \d[^\n]*)\n(.*?)(?=^---$|\Z)",
                         raw, re.S | re.M):
        label, chunk = m.group(1), m.group(2)
        body = re.split(r"\*\*Pre-fold opening:\*\*[^\n]*\n", chunk)
        body = body[-1]
        end = body.find("*Source:")
        if end > 0:
            body = body[:end]
        out.append((label, body.strip()))
    return out


def run_scan(verbose=True):
    del FINDINGS[:]
    raw = open(POSTS, encoding="utf-8").read()
    v = views(raw)
    blocks = post_blocks(raw)

    check_dashes("POSTS.md", v)
    check_banned("POSTS.md", v)
    check_question_opener("POSTS.md", blocks)
    check_superlative("POSTS.md", v)
    soft = check_universals("POSTS.md", v)
    check_engines("POSTS.md", v)
    check_measured_subjects("POSTS.md", v)
    check_word_counts(blocks)
    check_prefold(raw)
    refs = check_images()

    drawn = json.load(open(DRAWN, encoding="utf-8"))
    for fn, strings in drawn.items():
        dv = views("\n".join(strings))
        check_dashes("drawn/" + fn, dv)
        check_banned("drawn/" + fn, dv)
        check_superlative("drawn/" + fn, dv)
        check_universals("drawn/" + fn, dv)
        check_engines("drawn/" + fn, dv)
        check_measured_subjects("drawn/" + fn, dv)

    if verbose:
        print("scanned: POSTS.md (%d lines), %d rendered files (%d drawn strings), "
              "%d image references" % (len(v["lines"]), len(drawn),
                                       sum(len(s) for s in drawn.values()), len(refs)))
        print("measured-subject corpus: %d names harvested from %d research pages"
              % (len(measured_subjects()),
                 len(glob.glob(os.path.join(WEB, "ai-visibility-for-*.html")))))
        print("post word counts: %s"
              % ", ".join("%s=%d" % (l.split(",")[0],
                                     len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-\./]*", b)))
                          for l, b in blocks))
        print("soft absolutes present, adjudicated by hand not auto-failed: %s"
              % ", ".join(sorted(set(x.lower() for x in soft))) or "none")
        if FINDINGS:
            print("\nFINDINGS: %d" % len(FINDINGS))
            for c, w, d in FINDINGS:
                print("  [%s] %s :: %s" % (c, w, d))
        else:
            print("\nFINDINGS: 0")
    return list(FINDINGS)


# ------------------------------------------------------- negative controls ---
def controls():
    """Inject each defect, one at a time, confirm the check fires, restore."""
    raw = open(POSTS, encoding="utf-8").read()
    drawn_raw = open(DRAWN, encoding="utf-8").read()
    names = measured_subjects()
    # a real name from a research page, in several spelling variants, because
    # the diacritic bug only shows up when the control tries the variants
    diac = next((n for n in names if any(ord(c) > 127 for c in n)), None)
    plain = next((n for n in names if " " in n and n.isascii()), None)
    apos = next((n for n in names if "'" in n or "’" in n), None)

    injections = [
        ("dash", "POSTS", "\n\nA line with an em dash — right here.\n"),
        ("dash", "POSTS", "\n\nA line with an en dash – right here.\n"),
        ("banned-vocab", "POSTS", "\n\nA seamless and robust pipeline.\n"),
        ("banned-vocab", "POSTS", "\n\nWe leverage the collection queue.\n"),
        ("program-superlative", "POSTS",
         "\n\nThis is the first result of its kind anywhere in this research program.\n"),
        ("program-superlative", "POSTS",
         "\n\nThe strongest consensus found in this program so far.\n"),
        ("universal", "POSTS", "\n\nNobody does this by hand.\n"),
        ("universal", "POSTS", "\n\nEvery business is invisible to AI.\n"),
        ("retired-engine", "POSTS", "\n\nWe collect Meta AI results daily.\n"),
        ("not-live-engine", "POSTS", "\n\nCopilot and DeepSeek are included.\n"),
        ("engine-count", "POSTS", "\n\nWe monitor five engines today.\n"),
        ("image-missing", "POSTS", "\n\nSee feed/li-99-does-not-exist-1200x1200.png\n"),
        # image-size needs a file that EXISTS at the wrong size. Referencing a
        # missing file hits image-missing first and `continue`s past the size
        # test, which left this check blind on its first control run.
        ("image-size", "POSTS-REALFILE",
         "\n\nSee feed/li-98-control-1200x1200.png\n"),
        ("word-count", "POSTS", None),          # handled specially below
        ("prefold", "POSTS", None),             # handled specially below
        ("question-opener", "POSTS", None),     # handled specially below
        ("dash", "DRAWN", "—"),
        ("banned-vocab", "DRAWN", "a seamless result"),
        ("program-superlative", "DRAWN", "the first result anywhere in this research program"),
        ("measured-subject", "DRAWN", None),    # filled below
    ]
    if diac:
        injections.append(("measured-subject", "POSTS", "\n\nAs seen with %s.\n" % diac))
        injections.append(("measured-subject", "POSTS",
                           "\n\nAs seen with %s.\n" % fold_ascii(diac)))
    if plain:
        injections.append(("measured-subject", "POSTS", "\n\nAs seen with %s.\n" % plain))
        injections.append(("measured-subject", "POSTS",
                           "\n\nAs seen with #%s.\n" % plain.replace(" ", "")))
    if apos:
        injections.append(("measured-subject", "POSTS",
                           "\n\nAs seen with %s.\n" % apos.replace("'", "’")))
    # The two names this channel is most likely to leak, named explicitly rather
    # than left to a random sample: the real firm and the fabricated one that
    # post 1 is about. Both must fire, in both cases and with either ampersand
    # spacing.
    for probe in ("McDermott Will & Emery", "McDermott Will & Schulte",
                  "mcdermott will & schulte", "Cheval Blanc Patrimoine"):
        injections.append(("measured-subject", "POSTS",
                           "\n\nAs reported by %s.\n" % probe))
    injections = [i for i in injections if not (i[0] == "measured-subject" and i[2] is None)]

    fired, total, blind = 0, 0, []
    print("NEGATIVE CONTROLS")
    for check, target, payload in injections:
        total += 1
        try:
            if payload is None and check == "word-count":
                bad = raw.replace("Two AI engines returned the same law firm name. "
                                  "The firm does not exist.",
                                  "Two AI engines returned the same law firm name.")
                bad = re.sub(r"(?s)(## Post 1.*?\*\*Pre-fold opening:\*\*[^\n]*\n).*?(\*Source:)",
                             r"\1\nToo short.\n\n\2", bad)
                open(POSTS, "w", encoding="utf-8").write(bad)
            elif payload is None and check == "prefold":
                bad = raw.replace("**Pre-fold opening:** 66 characters",
                                  "**Pre-fold opening:** 64 characters")
                open(POSTS, "w", encoding="utf-8").write(bad)
            elif payload is None and check == "question-opener":
                bad = re.sub(r"(?s)(## Post 1.*?\*\*Pre-fold opening:\*\*[^\n]*\n\n)",
                             r"\1Is your brand invisible to AI?\n\n", raw)
                open(POSTS, "w", encoding="utf-8").write(bad)
            elif target == "POSTS-REALFILE":
                from PIL import Image as _I
                _I.new("RGB", (1000, 1000), (10, 11, 14)).save(
                    os.path.join(LI, "feed", "li-98-control-1200x1200.png"))
                open(POSTS, "w", encoding="utf-8").write(raw + payload)
            elif target == "POSTS":
                open(POSTS, "w", encoding="utf-8").write(raw + payload)
            else:
                d = json.loads(drawn_raw)
                k = sorted(d)[0]
                d[k] = d[k] + [payload]
                open(DRAWN, "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False))
            got = run_scan(verbose=False)
            hit = [f for f in got if f[0] == check]
            if hit:
                fired += 1
                print("  FIRED   %-22s %s" % (check, (payload or "(structural)")
                                              .strip().replace("\n", " ")[:56]))
            else:
                blind.append((check, payload))
                print("  BLIND   %-22s %s" % (check, (payload or "(structural)")
                                              .strip().replace("\n", " ")[:56]))
        finally:
            open(POSTS, "w", encoding="utf-8").write(raw)
            open(DRAWN, "w", encoding="utf-8").write(drawn_raw)
            ctl = os.path.join(LI, "feed", "li-98-control-1200x1200.png")
            if os.path.exists(ctl):
                os.remove(ctl)
    print("\n%d of %d injections fired" % (fired, total))
    if blind:
        print("BLIND CHECKS, these have told us nothing:")
        for c, p in blind:
            print("  %s :: %r" % (c, p))
    return fired, total, blind


def fold_ascii(s):
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c))


if __name__ == "__main__":
    if "--control" in sys.argv:
        f, t, blind = controls()
        print()
        got = run_scan()
        sys.exit(1 if (got or blind or f != t) else 0)
    sys.exit(1 if run_scan() else 0)
