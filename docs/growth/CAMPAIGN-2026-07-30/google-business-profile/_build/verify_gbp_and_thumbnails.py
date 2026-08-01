"""
Verification for the Google Business Profile posts and the YouTube Shorts
thumbnails, CAMPAIGN-2026-07-30.

Every check below is negative-controlled. Before the real run, each check is
handed a deliberately corrupted copy of the corpus carrying exactly the defect
it claims to catch, and it has to go red. A check nobody has watched fail has
told us nothing, and four checkers in this campaign were found broken by that
rule alone. The script prints "N of N injections fired" and refuses to report a
clean result if any injection was silently swallowed.

Traps this file is written against, all already paid for elsewhere:

  * camel-case hashtags evade word boundaries, so `#FirstEverStudy` is split
    before matching;
  * a wrapped line matches nothing, so every text is indexed both per line and
    joined-and-whitespace-normalised;
  * `Google` and `Google AI` are sub-spans of the permitted `Google AI Mode`,
    so engine matching is span-aware and non-maximal matches are discarded;
  * the whole delivered file is scanned, headings and tables included, not only
    the copy.

Run: python verify_gbp_and_thumbnails.py
"""

import glob
import html
import io
import os
import re
import sys
import unicodedata

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
GBP = os.path.abspath(os.path.join(HERE, ".."))
CAMPAIGN = os.path.abspath(os.path.join(HERE, "..", ".."))
THUMBS = os.path.join(CAMPAIGN, "youtube", "thumbnails")
SHORTS = os.path.join(CAMPAIGN, "youtube", "shorts")
REPO = os.path.abspath(os.path.join(CAMPAIGN, "..", "..", ".."))

POSTS_MD = os.path.join(GBP, "POSTS.md")
THUMBS_MD = os.path.join(THUMBS, "README.md")


# ---------------------------------------------------------------- helpers ---
def read(p):
    return io.open(p, encoding="utf-8").read()


def fold(s):
    """NFKD, strip combining marks, casefold, in that order. Without this
    `Engel & Volkers` passes while `Engel & Volkers` fires, or the reverse,
    depending on which spelling the corpus happens to hold."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")


def decamel(s):
    """`#FirstEverStudy` -> `# First Ever Study`. Word-boundary matching is
    blind to camel case, which is how a banned word rides through in a hashtag."""
    return CAMEL.sub(" ", s)


def variants(text):
    """Index a text three ways: as written, camel-split, and joined with all
    whitespace collapsed. A phrase broken over a line break matches only the
    third; a phrase inside a hashtag matches only the second."""
    joined = re.sub(r"\s+", " ", text)
    return [text, decamel(text), joined, decamel(joined)]


def find_terms(text, terms, word_boundary=True):
    """Every hit of any term, in any of the three indexings. Returns
    (term, snippet) pairs, deduplicated."""
    hits = set()
    for v in variants(text):
        vf = fold(v)
        for t in terms:
            tf = fold(t)
            pat = (r"\b" + re.escape(tf) + r"\b") if word_boundary else re.escape(tf)
            for m in re.finditer(pat, vf):
                s = max(0, m.start() - 44)
                hits.add((t, re.sub(r"\s+", " ", v[s:m.end() + 44]).strip()))
    return sorted(hits)


def maximal_spans(text, terms):
    """Span-aware match. `Google AI Mode` contains `Google AI` contains
    `Google`; only the longest match at a given position survives."""
    tf = fold(re.sub(r"\s+", " ", text))
    spans = []
    for t in terms:
        for m in re.finditer(r"\b" + re.escape(fold(t)) + r"\b", tf):
            spans.append((m.start(), m.end(), t))
    keep = []
    for a, b, t in spans:
        if not any(a2 <= a and b <= b2 and (b2 - a2) > (b - a) for a2, b2, _ in spans):
            keep.append((a, b, t))
    return keep


# ---------------------------------------------------------------- corpora ---
def extract_posts(md):
    """The four blockquote bodies under `## Post N of 4`."""
    out = []
    for m in re.finditer(r"^## Post (\d) of 4\s*$", md, re.M):
        rest = md[m.end():]
        end = rest.find("\n---")
        body = rest[:end if end > 0 else len(rest)]
        quoted = [ln[2:] if ln.startswith("> ") else ln[1:]
                  for ln in body.splitlines() if ln.startswith(">")]
        out.append((int(m.group(1)), " ".join(x.strip() for x in quoted).strip()))
    return [b for _, b in sorted(out)]


def load_thumb_table():
    """The nine (runid, headline lines, claim) rows, imported from the renderer
    so the verifier cannot drift from what was actually drawn."""
    sys.path.insert(0, HERE)
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "renderer", os.path.join(HERE, "render_gbp_and_thumbnails.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.THUMBS


def notes_onscreen(runid):
    """The on-screen text blocks of a run's NOTES, joined."""
    p = os.path.join(SHORTS, f"{runid}-youtube-NOTES.md")
    t = read(p)
    i = t.find("## On-screen text")
    seg = t[i:] if i >= 0 else t
    return "\n".join(re.findall(r"```\n(.*?)\n```", seg, re.S))


# ------------------------------------------------------- corpus blocklist ---
def measured_subjects():
    """Company names the research corpus actually names, pulled from the table
    cells of the published city and industry pages. Built from the corpus rather
    than typed by hand, so it cannot quietly go stale."""
    names = set()
    for p in glob.glob(os.path.join(REPO, "brandgeo", "web",
                                    "ai-visibility-for-*.html")):
        t = io.open(p, encoding="utf-8", errors="replace").read()
        for cell in re.findall(r"<td[^>]*>(.*?)</td>", t, re.S | re.I):
            s = html.unescape(re.sub(r"<[^>]+>", "", cell)).strip()
            if not (2 <= len(s) <= 48) or re.search(r"\d", s):
                continue
            if not re.match(r"^[A-ZÀ-ſ]", s):
                continue
            # A company name carries a second capitalised token, an ampersand,
            # or a corporate suffix. Category labels like "Employment law" and
            # "Accounting software" do not, and are dropped: they are English,
            # not entities, and would fire on ordinary prose.
            if (re.search(r"\s[A-ZÀ-ſ]", s) or "&" in s
                    or re.search(r"\b(LLP|LLC|Inc|Ltd|PC|Group|Co)\b", s)):
                names.add(s)
    return sorted(names)


# ----------------------------------------------------------------- lexicon --
DASHES = ["—", "–", "‒", "−", "―", "‐", "‑"]

BANNED = ["delve", "unlock", "unleash", "elevate", "harness", "leverage",
          "leveraging", "leveraged", "game-changer", "game changer",
          "supercharge", "revolutionize", "revolutionise", "seamless",
          "seamlessly", "robust", "cutting-edge", "cutting edge",
          "transformative", "dive in", "in today's fast-paced world"]

SUPERLATIVES = ["first", "only", "best", "worst", "strongest", "cleanest",
                "largest", "biggest", "unique", "unprecedented", "most",
                "never before", "industry-leading", "world-class"]

UNIVERSALS = ["nobody", "no one", "everyone", "everybody", "anyone", "always",
              "never", "cannot", "can't", "impossible", "every business",
              "all businesses", "no human", "every brand", "all brands"]

# Engines. Longest first does not matter, the matcher is span-aware, but the
# permitted set and the forbidden set must be disjoint on maximal spans.
LIVE_ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Google AI Mode",
                "Grok", "Google AI Overviews"]
DEAD_ENGINES = ["Meta AI", "Meta Llama", "Llama", "Copilot", "DeepSeek"]

# Exemption ledger. Only two kinds of entry are allowed:
#   ("quote", runid, string)  the string is a verbatim quotation of on-screen
#                             text from that run's delivered video, proven by
#                             lookup in its NOTES. Documenting what a shipped
#                             video says is not a new claim.
#   ("thumb", runid, string)  a thumbnail headline reproduced in the mapping
#                             table. Its proof is that every word of it already
#                             passes check_thumb_traceable against that Short's
#                             on-screen text, so the word is the video's, not a
#                             new claim about the research programme.
#   ("prose", None, string)   a phrase in the deliverable's own explanatory
#                             prose that is not a claim about the research
#                             programme. Each one is spelled out.
# Anything not in this ledger fails. The ledger is printed on every run.
EXEMPTIONS = [
    ("quote", "20260730-0113", "You rank first in Google."),
    ("quote", "20260730-0113", "Just never named."),
    ("thumb", "20260730-0113", "RANK FIRST. NOT NAMED."),
]


# ------------------------------------------------------------------ checks --
def check_dashes(c):
    out = []
    for name, text in c["files"].items():
        for d, snip in find_terms(text, DASHES, word_boundary=False):
            out.append(f"{name}: dash {d!r} in ...{snip}...")
    return out


def check_banned(c):
    out = []
    for name, text in c["files"].items():
        for t, snip in find_terms(text, BANNED):
            out.append(f"{name}: banned word {t!r} in ...{snip}...")
    return out


def _ledger_ok(kind_terms, text, name):
    """Drop hits whose snippet is covered by an exemption, and report the rest."""
    out = []
    for t, snip in kind_terms:
        covered = False
        for kind, runid, phrase in EXEMPTIONS:
            if fold(phrase) in fold(snip) or fold(snip) in fold(phrase):
                if kind == "quote":
                    src = notes_onscreen(runid)
                    if fold(phrase) not in fold(re.sub(r"\s+", " ", src)):
                        out.append(f"{name}: exemption {phrase!r} claims to quote "
                                   f"{runid} but that string is not in its NOTES")
                        covered = True
                        break
                if kind == "thumb":
                    bad = check_thumb_traceable(
                        {"thumbs": [(runid, [phrase], "")],
                         "notes": {runid: notes_onscreen(runid)}})
                    if bad:
                        out.append(f"{name}: exemption {phrase!r} claims to be a "
                                   f"traceable thumbnail headline for {runid}, "
                                   f"but {bad[0]}")
                        covered = True
                        break
                covered = True
                break
        if not covered:
            out.append(f"{name}: {t!r} in ...{snip}...")
    return out


def check_superlatives(c):
    out = []
    for name, text in c["files"].items():
        out += _ledger_ok(find_terms(text, SUPERLATIVES), text, f"{name} superlative")
    return out


def check_universals(c):
    out = []
    for name, text in c["files"].items():
        out += _ledger_ok(find_terms(text, UNIVERSALS), text, f"{name} universal")
    return out


def check_named_subjects(c):
    out = []
    for name, text in c["files"].items():
        for t, snip in find_terms(text, c["subjects"]):
            out.append(f"{name}: names a measured subject {t!r} in ...{snip}...")
    return out


def check_engines(c):
    """No retired or unbuilt engine may be presented in post copy, and every
    engine named must be one of the seven."""
    out = []
    for i, body in enumerate(c["posts"], 1):
        for _a, _b, t in maximal_spans(body, LIVE_ENGINES + DEAD_ENGINES):
            if t in DEAD_ENGINES:
                out.append(f"post {i}: names a non-collecting engine {t!r}")
    return out


def check_wordcount(c):
    out = []
    for i, body in enumerate(c["posts"], 1):
        n = len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'.,]*", body))
        if not 80 <= n <= 120:
            out.append(f"post {i}: {n} words, outside 80 to 120")
    return out


def check_one_cta(c):
    out = []
    for i, body in enumerate(c["posts"], 1):
        n = len(re.findall(r"getbrandgeo\.com", body, re.I))
        if n != 1:
            out.append(f"post {i}: {n} occurrences of getbrandgeo.com, expected 1")
            continue
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", body) if s.strip()]
        if "getbrandgeo.com" not in sentences[-1].lower():
            out.append(f"post {i}: CTA is not the closing sentence "
                       f"(last sentence: {sentences[-1]!r})")
    return out


def check_no_question_opener(c):
    out = []
    for i, body in enumerate(c["posts"], 1):
        first = re.split(r"(?<=[.!?])\s+", body.strip())[0]
        if first.rstrip().endswith("?"):
            out.append(f"post {i}: opens on a rhetorical question: {first!r}")
    return out


def check_bofu_pricing(c):
    """Brief section 3 rule 9: no BOFU asset without a price or the audit path."""
    out = []
    for i, body in enumerate(c["posts"], 1):
        if not re.search(r"EUR\s?[\d,]+", body):
            out.append(f"post {i}: BOFU post carries no price")
    return out


def check_thumb_words(c):
    out = []
    for runid, lines, _claim in c["thumbs"]:
        words = " ".join(lines).split()
        if len(words) > 5:
            out.append(f"{runid}: {len(words)} words on the thumbnail, ceiling is 5")
        if re.search(r"\d", " ".join(lines)):
            out.append(f"{runid}: thumbnail carries a digit, which cannot arrive "
                       f"with its denominator in this space")
    return out


def check_thumb_traceable(c):
    """Every content word on a thumbnail must appear in that Short's own
    on-screen text. Stem-matched at 7 characters so `recommended` matches
    `recommendation`, which is the same claim in a different inflection."""
    out = []
    for runid, lines, _claim in c["thumbs"]:
        src = fold(re.sub(r"[^\w\s]", " ", c["notes"][runid]))
        src_words = set(src.split())
        stems = {w[:7] for w in src_words}
        for w in re.findall(r"[A-Za-z]+", " ".join(lines)):
            wf = fold(w)
            if wf in src_words or wf[:7] in stems:
                continue
            out.append(f"{runid}: thumbnail word {w!r} appears nowhere in the "
                       f"Short's on-screen text")
    return out


def check_files(c):
    """Every image exists at the claimed size, every thumbnail maps to a Short
    that is really on disk, and the README lists all nine."""
    out = []
    for name, (w, h) in c["expect_images"].items():
        p = os.path.join(GBP if name.startswith("gbp-") else THUMBS, name)
        if not os.path.exists(p):
            out.append(f"missing image {name}")
            continue
        im = Image.open(p)
        if (im.width, im.height) != (w, h):
            out.append(f"{name}: {im.width}x{im.height}, expected {w}x{h}")
    for runid, _lines, _claim in c["thumbs"]:
        for suffix in ("silent.mp4", "scored.mp4"):
            p = os.path.join(SHORTS, f"{runid}-youtube-{suffix}")
            if not os.path.exists(p):
                out.append(f"{runid}: mapped Short {os.path.basename(p)} not on disk")
    md = c["files"].get("thumbnails/README.md", "")
    for runid, _l, _c2 in c["thumbs"]:
        if f"thumb-{runid}-youtube-1280x720.png" not in md:
            out.append(f"README does not map thumb-{runid}")
        if f"{runid}-youtube-silent.mp4" not in md:
            out.append(f"README does not name {runid}-youtube-silent.mp4")
    return out


CHECKS = [
    ("dashes", check_dashes),
    ("banned vocabulary", check_banned),
    ("superlatives", check_superlatives),
    ("universals over people", check_universals),
    ("named measured subject", check_named_subjects),
    ("engine lineup", check_engines),
    ("post word count 80 to 120", check_wordcount),
    ("exactly one CTA, closing", check_one_cta),
    ("no rhetorical-question opener", check_no_question_opener),
    ("BOFU carries a price", check_bofu_pricing),
    ("thumbnail word ceiling and digits", check_thumb_words),
    ("thumbnail traceable to its Short", check_thumb_traceable),
    ("files exist at the claimed size", check_files),
]


# ------------------------------------------------------------- injections ---
def build_corpus():
    posts_md, thumbs_md = read(POSTS_MD), read(THUMBS_MD)
    thumbs = load_thumb_table()
    expect = {f"gbp-{n}-{s}-1200x900.png": (1200, 900) for n, s in
              [(1, "free-audit"), (2, "essentials"), (3, "growth-pro"),
               (4, "plan-ladder")]}
    expect.update({f"thumb-{r}-youtube-1280x720.png": (1280, 720)
                   for r, _l, _c in thumbs})
    return {
        "files": {"google-business-profile/POSTS.md": posts_md,
                  "thumbnails/README.md": thumbs_md},
        "posts": extract_posts(posts_md),
        "thumbs": thumbs,
        "notes": {r: notes_onscreen(r) for r, _l, _c in thumbs},
        "subjects": measured_subjects(),
        "expect_images": expect,
    }


def clone(c):
    d = dict(c)
    d["files"] = dict(c["files"])
    d["posts"] = list(c["posts"])
    d["thumbs"] = [(r, list(l), cl) for r, l, cl in c["thumbs"]]
    d["expect_images"] = dict(c["expect_images"])
    return d


def injections(c):
    """One deliberate defect per check, each the exact fault that check exists
    to catch. `(check name, mutated corpus, what was done)`."""
    out = []

    d = clone(c)
    d["files"]["google-business-profile/POSTS.md"] += "\nan em dash — here\n"
    out.append(("dashes", d, "appended an em dash to POSTS.md"))

    d = clone(c)
    # camel case, to prove the hashtag evasion is closed
    d["files"]["thumbnails/README.md"] += "\n#SeamlessRobustPipeline\n"
    out.append(("banned vocabulary", d,
                "appended the hashtag #SeamlessRobustPipeline to the README"))

    d = clone(c)
    d["files"]["thumbnails/README.md"] += "\nthe #FirstEverStudy of its kind\n"
    out.append(("superlatives", d,
                "appended the hashtag #FirstEverStudy to the README"))

    d = clone(c)
    d["files"]["google-business-profile/POSTS.md"] += "\nnobody does this by hand\n"
    out.append(("universals over people", d,
                "appended 'nobody does this by hand' to POSTS.md"))

    d = clone(c)
    subject = c["subjects"][0] if c["subjects"] else "Clifford Chance"
    d["files"]["google-business-profile/POSTS.md"] += f"\nas {subject} found\n"
    out.append(("named measured subject", d,
                f"named the measured subject {subject!r} in POSTS.md"))

    d = clone(c)
    d["posts"][0] = d["posts"][0].replace("Google AI Mode", "Meta AI")
    out.append(("engine lineup", d, "swapped Google AI Mode for Meta AI in post 1"))

    d = clone(c)
    d["posts"][1] = " ".join(d["posts"][1].split()[:40])
    out.append(("post word count 80 to 120", d, "truncated post 2 to 40 words"))

    d = clone(c)
    d["posts"][2] += " Also see getbrandgeo.com for more."
    out.append(("exactly one CTA, closing", d,
                "added a second getbrandgeo.com mention to post 3"))

    d = clone(c)
    d["posts"][3] = "Is your brand invisible to AI? " + d["posts"][3]
    out.append(("no rhetorical-question opener", d,
                "prefixed post 4 with a rhetorical question"))

    d = clone(c)
    d["posts"][0] = re.sub(r"EUR\s?[\d,]+", "nothing", d["posts"][0])
    out.append(("BOFU carries a price", d, "stripped every price from post 1"))

    d = clone(c)
    d["thumbs"][2] = (d["thumbs"][2][0],
                      ["ONE PATTERN HELD", "IN 5 OF 5 CITIES"], d["thumbs"][2][2])
    out.append(("thumbnail word ceiling and digits", d,
                "made thumbnail 3 seven words long and gave it a figure"))

    d = clone(c)
    d["thumbs"][5] = (d["thumbs"][5][0], ["GUARANTEED", "RESULTS"], d["thumbs"][5][2])
    out.append(("thumbnail traceable to its Short", d,
                "put 'GUARANTEED RESULTS' on thumbnail 6, which its Short "
                "does not say"))

    d = clone(c)
    d["expect_images"]["thumb-20260730-0313-youtube-1280x720.png"] = (1920, 1080)
    out.append(("files exist at the claimed size", d,
                "asserted thumbnail 6 is 1920x1080"))

    # Deliberate control on the exemption ledger itself: an exemption that
    # claims to quote a Short must actually be in that Short.
    d = clone(c)
    d["files"]["thumbnails/README.md"] += "\nJust never named.\n"
    out.append(("universals over people (ledger holds)", d,
                "added a second 'Just never named.', which the ledger covers, "
                "so this one is expected NOT to fire"))

    return out


def main():
    c = build_corpus()

    print("corpus")
    print(f"  POSTS.md            {len(c['files']['google-business-profile/POSTS.md'])} chars, "
          f"{len(c['posts'])} post bodies extracted")
    print(f"  thumbnails/README   {len(c['files']['thumbnails/README.md'])} chars")
    print(f"  thumbnails          {len(c['thumbs'])}")
    print(f"  measured-subject blocklist  {len(c['subjects'])} names, built from "
          f"{len(glob.glob(os.path.join(REPO, 'brandgeo', 'web', 'ai-visibility-for-*.html')))} "
          f"published research pages")
    assert c["posts"] and len(c["posts"]) == 4, "post extraction is broken"
    assert len(c["thumbs"]) == 9
    assert len(c["subjects"]) > 40, "blocklist looks empty, the extractor is blind"

    print("\nexemption ledger (printed so it can be audited, not buried)")
    for kind, runid, phrase in EXEMPTIONS:
        where = f"quotes {runid}" if kind == "quote" else "prose"
        print(f"  [{where}] {phrase!r}")
    if not EXEMPTIONS:
        print("  (empty)")

    print("\nnegative controls")
    expected_fire = [n for n, _d, _w in injections(c) if "ledger holds" not in n]
    fired = 0
    total = 0
    for name, corpus, what in injections(c):
        if "ledger holds" in name:
            real = name.replace(" (ledger holds)", "")
            fn = dict(CHECKS)[real]
            res = fn(corpus)
            ok = not res
            print(f"  [{'ok  ' if ok else 'BAD '}] {real:<38} {what}")
            assert ok, f"ledger control fired when it should not: {res}"
            continue
        total += 1
        fn = dict(CHECKS)[name]
        res = fn(corpus)
        if res:
            fired += 1
            print(f"  [fired] {name:<38} {what}")
            print(f"          -> {res[0]}")
        else:
            print(f"  [BLIND] {name:<38} {what}")
    print(f"  {fired} of {total} injections fired")
    assert fired == total, "a check is blind and must be fixed before it is trusted"
    assert total == len(CHECKS), (
        f"{total} injections for {len(CHECKS)} checks; every check needs one")
    del expected_fire

    print("\nreal run")
    failures = []
    for name, fn in CHECKS:
        res = fn(c)
        print(f"  {name:<40} {'clean' if not res else f'{len(res)} FINDING(S)'}")
        for r in res:
            print(f"      {r}")
        failures += res

    print()
    for i, body in enumerate(c["posts"], 1):
        n = len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'.,]*", body))
        print(f"  post {i}: {n} words")

    if failures:
        print(f"\nSCAN FAILED, {len(failures)} finding(s)")
        return 1
    print("\nSCAN PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
