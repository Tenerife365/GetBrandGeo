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

# A prompt count is only a PLAN claim when a plan name or a price sits near it.
# Without this, "12 prompts across seven engines" in a sample report reads as a
# violation, which it is not.
PLAN_CONTEXT = re.compile(
    r"free|essentials|growth|managed|enterprise|per month|/mo\b|EUR|&#x20AC;|€", re.I)

# Values that are wrong wherever they appear. Each carries why, so a future
# reader can retire the rule when it stops being true rather than guessing.
FORBIDDEN = [
    (r"\bMeta AI\b", "meta is RETIRED (2026-07-16), in no plan set. Historical "
                     "research records are the ONE exception: if this hit is a "
                     "record of what an engine answered on a date, keep it."),
    (r"\bGPT-4o\b(?!-mini)", "no plan runs GPT-4o. _collect.js routes gpt-4o-mini "
                             "on free/essentials and gpt-5.5 on growth and up."),
    (r"1[,.]?250", "the EUR 1,250 setup fee is refuted by terms.html:317, which "
                   "states Managed has no separate setup fee."),
    (r"\bCSV\b", "no export feature exists. Zero matches for csv/download/toBlob/"
                 "createObjectURL/xlsx across brandgeo-dashboard/src."),
    (r"daily/weekly|daily or weekly", "cadence is not a tier differentiator. "
                                      "PLAN_COLLECTION_COOLDOWN_HOURS is 168h flat "
                                      "on every paid plan, 720h on free."),
    (r"(?:EUR|&#x20AC;|€)\s?900\b", "Managed is EUR 1,500, not EUR 900."),
    (r"(?:EUR|&#x20AC;|€)\s?9,000\b", "Managed annual is EUR 15,000."),
    (r"(?:EUR|&#x20AC;|€)\s?10,000\b", "Enterprise publishes no figure. It is "
                                            "scoped on a call."),
]


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


def surface_files():
    out = []
    for pat in SURFACES:
        for p in glob.glob(os.path.join(ROOT, pat), recursive=True):
            if os.path.basename(p) not in EXCLUDE:
                out.append(p)
    return sorted(set(out))


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

        for i, line in enumerate(lines, 1):
            for pat, why in FORBIDDEN:
                for m in re.finditer(pat, line, re.I):
                    findings.append((rel, i, m.group(0), why, line.strip()[:90]))
            for m in re.finditer(r"\b(\d{1,4})\s+(?:commercial\s+|buyer\s+)?prompts\b", line, re.I):
                # Only a plan claim if a plan name or price is nearby. A sample
                # report saying "12 prompts across seven engines" is not a cap.
                near = line[max(0, m.start() - 120): m.end() + 120]
                if m.group(1) not in valid and PLAN_CONTEXT.search(near):
                    findings.append((rel, i, m.group(0),
                                     f"not an enforced cap. PLAN_PROMPTS allows {sorted(valid, key=int)}",
                                     line.strip()[:90]))

    if not findings:
        print(f"{len(surface_files())} surfaces checked, no contradictions found.")
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
