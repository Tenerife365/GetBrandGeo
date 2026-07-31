#!/usr/bin/env bash
# Verifies every logo/wordmark on the site and in the dashboard actually links
# somewhere (ROADMAP.md Stream B, item B1). Two halves:
#
#   1. Marketing site (brandgeo/web/*.html) — every page must have a
#      `<a href="..." class="logo">`, except pages in MARKETING_EXCEPTIONS
#      that are deliberately headerless (documented inline below).
#
#   2. Dashboard (brandgeo-dashboard/src/**/*.tsx) — every `<BrandGeoMark ...>`
#      call site must carry a `to=` (internal route, via NavLink) or `href=`
#      (external URL, via <a>) prop. A BrandGeoMark with neither renders as an
#      inert, non-clickable mark — that is the exact bug this script catches.
#
# Exit 0 when every logo resolves somewhere; exit 1 and print each offender
# otherwise.
set -euo pipefail
cd "$(dirname "$0")/.."

fail=0

# --- 1. Marketing site ---------------------------------------------------
# thanks.html is a standalone post-submit confirmation page with no header/nav
# at all (by design — a distraction-free "we got it" screen). Its way home is
# a text CTA ("Back to BrandGEO" -> href="/"), not a .logo mark, so it is
# exempt rather than failing.
MARKETING_EXCEPTIONS=("brandgeo/web/thanks.html")

is_exception() {
  local f="$1"
  for ex in "${MARKETING_EXCEPTIONS[@]}"; do
    [ "$f" = "$ex" ] && return 0
  done
  return 1
}

shopt -s nullglob
for f in brandgeo/web/*.html; do
  if is_exception "$f"; then continue; fi
  if ! grep -q 'class="logo"' "$f"; then
    echo "FAIL: $f has no element with class=\"logo\""
    fail=1
    continue
  fi
  if ! grep -oP '<a\s+(href="[^"]+"\s+class="logo"|class="logo"\s+href="[^"]+")' "$f" >/dev/null; then
    echo "FAIL: $f's .logo has no href (not a link)"
    fail=1
  fi
done

# --- 2. Dashboard ----------------------------------------------------------
set +e
dash_result=$(node --input-type=module -e '
import { readFileSync } from "fs";
import { execSync } from "child_process";

const files = execSync(
  "grep -rl \"BrandGeoMark\" brandgeo-dashboard/src/components brandgeo-dashboard/src/pages --include=*.tsx",
  { encoding: "utf8" }
).trim().split("\n").filter(Boolean);

let fail = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const re = /<BrandGeoMark\b[\s\S]*?\/>/g;
  let m;
  while ((m = re.exec(src))) {
    const block = m[0];
    if (!/\bto=/.test(block) && !/\bhref=/.test(block)) {
      console.log(`FAIL: ${f} has a <BrandGeoMark> with no to= or href= (inert logo): ${block.replace(/\s+/g, " ").slice(0, 120)}`);
      fail = 1;
    }
  }
}
process.exit(fail);
')
dash_exit=$?
set -e
[ -n "$dash_result" ] && echo "$dash_result"
[ "$dash_exit" != 0 ] && fail=1

if [ "$fail" = 0 ]; then
  echo "OK: every logo on the marketing site and in the dashboard links somewhere"
fi
exit $fail
