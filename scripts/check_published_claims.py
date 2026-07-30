"""Check every published surface against what the code actually enforces.

WHY THIS EXISTS
  On 2026-07-29 the same stale pricing ladder was found on EIGHT independent
  surfaces: faq.html, _assistant_kb.js, llms-full.txt, terms.html,
  brandgeo-vs-peec.html, brandgeo-vs-otterly.html, glossary.html, and index.html's
  Enterprise feature list. Each had been written once from the then-current
  numbers and never re-derived. Growth was advertised at 150 prompts while the
  code enforced 35, and a EUR 1,250 setup fee was quoted that the company's own
  terms deny.

  Fixing eight files does not stop a ninth. This does.

  It matters more here than on a normal product: BrandGEO sells measurement of
  how AI engines describe brands, and `llms-full.txt` is the file it points
  crawlers at. A wrong number there is fed directly to the engines it sells
  monitoring of.

WHAT IT DOES
  Parses planConfig.ts for ground truth, then greps every published surface for
  figures that contradict it, plus a list of strings that should never appear
  anywhere (retired engines, refuted fees, features that do not exist).

  It cannot prove copy is CORRECT, only that known-wrong values are absent.
  That is the achievable check, and it would have caught all eight.

USAGE
  python scripts/check_published_claims.py          exit 1 on any finding
  python scripts/check_published_claims.py --list   show ground truth and stop
"""

import argparse
import glob
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PLAN_CONFIG = os.path.join(ROOT, "brandgeo-dashboard", "src", "lib", "planConfig.ts")

# ONLY surfaces that make product claims. This distinction is the whole design.
#
# A first pass scanned every page and returned 200 findings across 65 files, of
# which almost none were real: city research pages legitimately report what Meta
# AI answered in July, and "8 prompts" on a study page is its sample size, not a
# plan cap. A checker that cries wolf 200 times is worse than no checker, because
# it trains everyone to skip the output.
#
# Research pages (ai-visibility-for-*, bg-*, news/**, the index issues) are
# historical records BY CONSTRUCTION and are deliberately not scanned. If one
# ever starts advertising a price, it has stopped being research.
SURFACES = [
    "brandgeo/web/index.html",
    "brandgeo/web/faq.html",
    "brandgeo/web/terms.html",
    "brandgeo/web/privacy.html",
    "brandgeo/web/glossary.html",
    "brandgeo/web/support.html",
    "brandgeo/web/get-found-online.html",
    "brandgeo/web/welcome.html",
    "brandgeo/web/thanks.html",
    "brandgeo/web/brandgeo-vs-*.html",
    "brandgeo/web/llms.txt",
    "brandgeo/web/llms-full.txt",
    "brandgeo-dashboard/netlify/functions/_assistant_kb.js",
]
# Internal tool, never uploaded to cPanel, contains JS template literals.
EXCLUDE = {"article-builder.html"}

# ── Cross-corpus superlatives ────────────────────────────────────────────────
# A SECOND surface list, deliberately the near-inverse of SURFACES above.
#
# The pricing rules skip research pages because a research page reporting what
# Meta AI answered in July is a record, not a product claim. But that exemption
# hid a different defect living on exactly those pages, found 2026-07-30:
#
#   Madrid  "the most unanimous result of any city tested so far"
#   Paris   "the cleanest, most unanimous consensus found anywhere in this
#            research program"        <- same collection run as Madrid
#   Chicago "the first fully unanimous result measured anywhere in this
#            research program"        <- also in its FAQPage JSON-LD
#   Boston  "the most 5/5-dense city measured in this research program"
#
# A superlative is a claim about every OTHER page in the corpus, so the page
# making it is the one source that cannot check it. Several were mutually
# exclusive, and two reached rendered marketing assets before anyone noticed.
# Worse, Chicago's sat inside FAQPage JSON-LD, so an engine parsing the page
# ingested it as a fact about the program, on a product sold on correct parsing.
#
# The pattern is structural, not careless: each page was written against its own
# findings doc, and each findings doc compared itself only to the cities written
# before it. That yields an escalating chain of "strongest yet" with nothing to
# check it against.
#
# WHAT IS ALLOWED, and why the rule is shaped this way:
#   - Page-scoped claims. "the densest result in the Baltimore dataset" names
#     its denominator and cannot contradict another page.
#   - Dated program-wide claims. "as of 2026-07-30" makes the claim checkable
#     against the ledger and honest about ageing. This is the sanctioned form
#     for a genuine program-wide count, e.g. Detroit's seven-firm convergence.
#   - Counts, not orderings. Collection dates are day-granular and most cities
#     share one, so "first"/"previous"/"the fourth city" assert an ordering the
#     data does not have. A count ("11 of the 21 cities") survives; an ordinal
#     does not.
#
# Ledger of what is currently true and sayable:
#   docs/research/cross-city-consensus-inventory-2026-07-30.md
SUPERLATIVE_SURFACES = [
    "brandgeo/web/ai-visibility-for-*.html",
    "brandgeo/web/bg-*.html",
    "brandgeo/web/ai-visibility-index-*.html",
    "brandgeo/web/blog.html",
    "brandgeo/web/llms.txt",
    "brandgeo/web/llms-full.txt",
]

# Ranking words. Only meaningful when they land near a corpus scope, below.
_RANK = (r"\b(?:first|only|strongest|cleanest|densest|clearest|highest|lowest|"
         r"most|widest|tightest|sharpest|biggest|largest|worst|best|"
         r"unprecedented|unmatched)\b")

# Phrases that scope a claim to the WHOLE corpus. These are the ones a single
# page cannot verify about itself.
_CORPUS = (r"(?:anywhere in (?:this|the)|in this (?:entire )?research program|"
           r"in this program|in the (?:whole|entire) (?:program|dataset)|"
           r"of any city|of any category|program-wide|"
           r"any city (?:tested|measured|researched)|"
           r"(?:we|we've|we have) (?:ever )?measured|measured anywhere|"
           r"of (?:all|every) cit(?:y|ies))")

# A dated claim is the sanctioned escape hatch: it is checkable and it admits
# it will age. A page-scoped denominator is fine too.
_DATED = re.compile(r"as of \d{4}-\d{2}-\d{2}", re.I)
_PAGE_SCOPED = re.compile(r"in (?:the [A-Z][A-Za-z .'-]{2,30}|this) dataset", re.I)

SUPERLATIVE_RULES = [
    ("corpus-superlative",
     re.compile(_RANK + r"[^.<>]{0,90}?" + _CORPUS, re.I),
     "ranks this page against the whole corpus, which this page cannot verify. "
     "Scope it to this page's own dataset, or state it as a dated count "
     "('as of YYYY-MM-DD') after checking the ledger in "
     "docs/research/cross-city-consensus-inventory-2026-07-30.md."),

    ("city-ordinal",
     re.compile(r"\bthe (?:second|third|fourth|fifth|sixth|seventh|eighth|"
                r"ninth|tenth) (?:city|brand|team|firm)\b", re.I),
     "asserts an ordering the data does not support. Collection dates are "
     "day-granular and most cities share one, so no page is 'the fourth' "
     "anything. Use a count or name the cities."),

    ("ageing-superlative",
     re.compile(_RANK + r"[^.<>]{0,60}?(?:so far|to date|yet measured|"
                r"ever recorded)|(?:previous(?:ly)? (?:best|densest|city|record))",
     re.I),
     "'so far' dates a ranking to the moment it was written and never updates. "
     "Drop the ranking or replace it with a dated count."),
]

# Documented exceptions, same four-part shape as EXEMPT above: rule, file,
# an exact context substring, and why. Anything not matching all of it fails.
SUPERLATIVE_EXEMPT = [
    # BG-017 is a DOI-archived paper (Zenodo 10.5281/zenodo.21395598) whose
    # corpus is enumerated on the page itself: London, Berlin, Madrid, New York,
    # Paris, Rome, Dublin. A superlative over a named, fixed, seven-city set is
    # verifiable and does not age. Rewriting it would also desynchronise the
    # live page from the archived record, which is worse than the phrasing.
    ("corpus-superlative", "bg-017.html", "highest overall consensus rate of any city",
     "bounded to this paper's enumerated seven-city corpus; DOI-archived."),
    ("corpus-superlative", "bg-017.html", "most noise-corrupted single response in the whole program",
     "same paper, same enumerated corpus, and it is a self-reported data-quality "
     "caveat rather than a boast. Editing the live page would also desynchronise "
     "it from the Zenodo record."),
    ("ageing-superlative", "bg-018.html", "had not tested yet",
     "'not tested yet' describes a test plan, not a ranking."),
    # Industry-level claims sourced to third-party benchmarks. The denominator
    # is the cited study's, not this program's, so no city page can contradict
    # them. Deleting them would falsify a correctly attributed citation.
    ("corpus-superlative", "ai-visibility-for-healthcare.html", "BG-008",
     "sourced to BG-008 / Siftly's 2026 AI Citation Rate Benchmarks."),
    ("corpus-superlative", "ai-visibility-for-real-estate.html", "BG-008",
     "sourced to BG-008's industry study, not this program's city corpus."),
    ("corpus-superlative", "bg-008.html", "Siftly's 2026 AI Citation Rate Benchmarks",
     "third-party benchmark, its own denominator."),
    ("corpus-superlative", "bg-009.html", "Ahrefs' separate 17-million-citation",
     "third-party benchmark, its own denominator."),
    ("corpus-superlative", "bg-006.html", "the highest rate of any engine in the test",
     "scoped to that article's own engine test, an enumerated set."),
    ("corpus-superlative", "llms-full.txt", "the highest of any industry measured",
     "industry-level, sourced to the law-firm guide's cited benchmark."),
]

# Every way a euro figure is written on these surfaces. `&euro;` was missing
# until 2026-07-29 and that single gap hid a live EUR 900 Managed price on
# brandgeo-vs-ahrefs-brand-radar.html for as long as the rule had existed: the
# JSON-LD blocks use a literal €, the HTML bodies use &euro;, and the rule only
# knew the first two. Add every new spelling here, never to one rule.
EUR = r"(?:EUR|&#x20AC;|&euro;|€)"

# A prompt count is only a PLAN claim when a plan name or a price sits near it.
# Without this, "12 prompts across seven engines" in a sample report reads as a
# violation, which it is not.
PLAN_CONTEXT = re.compile(
    r"free|essentials|growth|managed|enterprise|per month|/mo\b|" + EUR, re.I)

# Values that are wrong wherever they appear. Each carries a label (used by
# EXEMPT below) and why, so a future reader can retire the rule when it stops
# being true rather than guessing.
FORBIDDEN = [
    ("meta", r"\bMeta AI\b",
     "meta is RETIRED (2026-07-16), in no plan set. Historical research records "
     "are the ONE exception: if this hit is a record of what an engine answered "
     "on a date, keep it."),
    ("gpt4o", r"\bGPT-4o\b(?!-mini)",
     "no plan runs GPT-4o. _collect.js routes gpt-4o-mini on free/essentials and "
     "gpt-5.5 on growth and up."),
    ("setup-fee", r"1[,.]?250",
     "the EUR 1,250 setup fee is refuted by terms.html, which states Managed has "
     "no separate setup fee."),
    ("csv", r"\bCSV\b",
     "no export feature exists. Zero matches for csv/download/toBlob/"
     "createObjectURL/xlsx across brandgeo-dashboard/src."),
    ("cadence", r"daily/weekly|daily or weekly",
     "cadence is not a tier differentiator. PLAN_COLLECTION_COOLDOWN_HOURS is "
     "168h flat on every paid plan, 720h on free."),
    ("managed-900", EUR + r"\s?900\b", "Managed is EUR 1,500, not EUR 900."),
    ("managed-9000", EUR + r"\s?9,000\b", "Managed annual is EUR 15,000."),
    ("ent-10000", EUR + r"\s?10,000\b",
     "Enterprise publishes no figure. It is scoped on a call."),
    ("legacy-pro", r"\bPro from\s*" + EUR,
     "the legacy `pro` tier is closed to new signups (planConfig.ts). The top "
     "self-serve tier is Growth PRO at EUR 449; above it are Managed and Custom "
     "Enterprise."),
]

# ── Documented exceptions ────────────────────────────────────────────────────
# A hit that is NOT a claim about BrandGEO's own product. Each entry names the
# rule it exempts, the file, an exact context substring that must be present on
# the line, and why. Anything that does not match all four still fails, so a new
# occurrence somewhere else is caught rather than silently inherited.
#
# Deleting these strings would not fix drift, it would falsify the record: a
# competitor really does track Meta AI, and AthenaHQ really does sell credits in
# packs of 1,250.
EXEMPT = [
    ("meta", "brandgeo-vs-goodie.html", "Goodie tracks the broadest set publicly listed",
     "Goodie AI's own published engine list, not BrandGEO's."),
    ("meta", "brandgeo-vs-goodie.html", "Broader list publicly cited",
     "Goodie AI's own published engine list, in the competitor column."),
    ("meta", "brandgeo-vs-profound.html", "Profound tracks 10+ engines",
     "Profound's own engine list, cited to argue they cover more than we do."),
    ("meta", "brandgeo-vs-semrush.html", "custom-priced Enterprise",
     "the engines Semrush gates behind its Enterprise tier, not ours."),
    ("setup-fee", "brandgeo-vs-athenahq.html", "AthenaHQ bills by credits",
     "AthenaHQ's credit-pack price (~$100 per 1,250 credits), in USD, theirs."),
    ("meta", "llms-full.txt", "four AI engines (Google Gemini, Anthropic Claude, Perplexity, Meta AI",
     "the engine set of a published, DOI-archived study (Zenodo 10.5281/"
     "zenodo.21395598). A historical measurement record, the documented exception "
     "in the `meta` rule above."),
]

# In a side-by-side comparison row the BrandGEO cell is the one marked
# class="hl"; every other <td> describes a COMPETITOR's product, and its prices,
# prompt counts and engine lists are theirs. Scanning the whole line made a
# comparison table unwritable: Otterly's "100 prompts" sat within 120 characters
# of BrandGEO's own price and read as a stale cap, and Semrush's Meta AI
# coverage read as ours. Blank the competitor cells before scanning, preserving
# length so reported column offsets stay true.
_HL_ROW = re.compile(r'<td\b[^>]*\bclass="hl"')
_CELL = re.compile(r"<td\b[^>]*>.*?</td>")


def ours(line):
    if not _HL_ROW.search(line):
        return line          # not a comparison row: every word on it is ours
    out, pos = [], 0
    for m in _CELL.finditer(line):
        out.append(line[pos:m.start()])
        seg = m.group(0)
        out.append(seg if 'class="hl"' in seg else " " * len(seg))
        pos = m.end()
    out.append(line[pos:])
    return "".join(out)


def exempt(label, rel, line):
    return any(lab == label and rel.endswith(f) and ctx in line
               for lab, f, ctx, _ in EXEMPT)


def ground_truth():
    """Read the enforced values rather than trusting any doc."""
    src = open(PLAN_CONFIG, encoding="utf-8").read()

    def const_map(name, cast=int):
        m = re.search(name + r"[^{]*\{(.*?)\n\}", src, re.S)
        if not m:
            return {}
        out = {}
        for k, v in re.findall(r"(\w+):\s*([0-9]+)", m.group(1)):
            out[k] = cast(v)
        return out

    prompts = const_map("PLAN_PROMPTS")
    cooldown = const_map("PLAN_COLLECTION_COOLDOWN_HOURS")

    engines = {}
    m = re.search(r"PLAN_(?:LIVE_)?ENGINES[^{]*\{(.*?)\n\}", src, re.S)
    if m:
        for plan, lst in re.findall(r"(\w+):\s*\[([^\]]*)\]", m.group(1)):
            engines[plan] = [e.strip().strip("'\"") for e in lst.split(",") if e.strip()]
    return prompts, cooldown, engines


def surface_files(patterns=None):
    out = []
    for pat in (patterns or SURFACES):
        for p in glob.glob(os.path.join(ROOT, pat), recursive=True):
            if os.path.basename(p) not in EXCLUDE:
                out.append(p)
    return sorted(set(out))


def superlative_exempt(label, rel, line):
    return any(lab == label and rel.endswith(f) and ctx in line
               for lab, f, ctx, _ in SUPERLATIVE_EXEMPT)


def scan_superlatives():
    """Cross-corpus ranking claims on research pages.

    Separate from the pricing rules because it runs over the near-inverse
    surface list. See the SUPERLATIVE_SURFACES comment for the incident.
    """
    findings = []
    for path in surface_files(SUPERLATIVE_SURFACES):
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        for i, raw in enumerate(
                open(path, encoding="utf-8", errors="replace").read().splitlines(), 1):
            # A dated claim is checkable and admits it ages; a page-scoped one
            # names its denominator. Both are the fix, not the defect.
            if _DATED.search(raw) or _PAGE_SCOPED.search(raw):
                continue
            for label, pat, why in SUPERLATIVE_RULES:
                m = pat.search(raw)
                if m and not superlative_exempt(label, rel, raw):
                    findings.append((rel, i, m.group(0)[:70], why, raw.strip()[:90]))
                    break   # one finding per line is enough to send someone to it
    return findings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()

    prompts, cooldown, engines = ground_truth()
    if a.list:
        print("Ground truth, read from planConfig.ts\n")
        for p in ("free", "essentials", "growth", "growth_pro", "managed"):
            print(f"  {p:12} prompts={prompts.get(p,'?'):>6}  "
                  f"engines={len(engines.get(p,[])):>2}  "
                  f"cooldown={cooldown.get(p,'?')}h")
        return 0

    # A stale prompt cap is any number presented as a prompt count that is not
    # one the code enforces. Matching "<n> prompts" keeps false positives low.
    valid = set(str(v) for v in prompts.values())
    findings = []

    for path in surface_files():
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        text = open(path, encoding="utf-8", errors="replace").read()
        lines = text.splitlines()

        for i, raw in enumerate(lines, 1):
            line = ours(raw)
            for label, pat, why in FORBIDDEN:
                for m in re.finditer(pat, line, re.I):
                    if exempt(label, rel, raw):
                        continue
                    findings.append((rel, i, m.group(0), why, raw.strip()[:90]))
            for m in re.finditer(r"\b(\d{1,4})\s+(?:commercial\s+|buyer\s+)?prompts\b", line, re.I):
                # Only a plan claim if a plan name or price is nearby. A sample
                # report saying "12 prompts across seven engines" is not a cap.
                near = line[max(0, m.start() - 120): m.end() + 120]
                if m.group(1) not in valid and PLAN_CONTEXT.search(near):
                    findings.append((rel, i, m.group(0),
                                     f"not an enforced cap. PLAN_PROMPTS allows {sorted(valid, key=int)}",
                                     line.strip()[:90]))

    sup = scan_superlatives()
    findings.extend(sup)

    if not findings:
        print(f"{len(surface_files())} product surfaces and "
              f"{len(surface_files(SUPERLATIVE_SURFACES))} research surfaces checked, "
              "no contradictions found.")
        return 0

    print(f"{len(findings)} finding(s) across {len(set(f[0] for f in findings))} file(s):\n")
    last = None
    for rel, ln, hit, why, ctx in findings:
        if rel != last:
            print(f"  {rel}")
            last = rel
        print(f"    :{ln:<5} {hit!r}")
        print(f"           {why}")
        print(f"           > {ctx}")
    print("\nHistorical research records that report what an engine ANSWERED on a "
          "date are legitimate and must not be rewritten. Everything else is drift.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
