#!/usr/bin/env bash
# Verifies the acquisition funnel's SUCCESS path offers a forward step, and that
# the step carries the visitor's domain all the way into account setup
# (ROADMAP.md Stream C, items C1b and C2; docs/qa/acquisition-funnel-audit.md
# F3 and F5).
#
# The defect this exists to catch is an inversion, not an omission. Before C2,
# redirectToSignup() was called from exactly one place in site.js: the ERROR
# handler. A visitor whose audit failed was carried to signup?domain= prefilled
# in one hop; a visitor whose audit SUCCEEDED got an email form and a dead end.
# Grepping for "signup" alone would have passed on that broken state, so every
# check below is positional or cross-file: it asks where the forward step is,
# and whether the domain survives each hop.
#
# The four hops, and what breaks if one is missing:
#
#   1. widget result card   -> signup?domain=   (else: success dead-ends)
#   2. full report page     -> signup?domain=   (else: cross-domain hop to a
#                                                marketing anchor, F5)
#   3. /signup reads ?domain= and stores it     (else: the domain is dropped and
#                                                the visitor retypes it)
#   4. /welcome prefills from the stored domain (else: step 3 was pointless)
#
# Exit 0 when all four hold; exit 1 and name each offender otherwise.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_JS="brandgeo/web/site.js"
INDEX_HTML="brandgeo/web/index.html"
REPORT_TSX="brandgeo-dashboard/src/pages/AuditReport.tsx"
SIGNUP_TSX="brandgeo-dashboard/src/pages/Signup.tsx"
WELCOME_TSX="brandgeo-dashboard/src/pages/Welcome.tsx"
DOMAIN_LIB="brandgeo-dashboard/src/lib/signupDomain.ts"

fail=0
note() { echo "FAIL: $*"; fail=1; }

for f in "$SITE_JS" "$INDEX_HTML" "$REPORT_TSX" "$SIGNUP_TSX" "$WELCOME_TSX"; do
  [ -f "$f" ] || { note "$f is missing"; }
done
[ "$fail" = 0 ] || exit 1

# --- Hop 1: the widget's SUCCESS path offers signup, not only the error path --
#
# Positional, deliberately. `audit-forward-link` must appear in the file BEFORE
# `function startAudit`, because renderAuditResult() is defined above it and the
# error handler that already had a signup redirect lives inside startAudit().
# A forward link that only appears after that point is the old inverted funnel
# passing a naive grep.
if ! grep -q 'audit-forward-link' "$SITE_JS"; then
  note "$SITE_JS has no .audit-forward-link (the success path offers no forward step)"
else
  node -e '
    const fs = require("fs");
    const src = fs.readFileSync(process.argv[1], "utf8");
    const link = src.indexOf("audit-forward-link");
    const startAudit = src.indexOf("function startAudit");
    if (startAudit === -1) { console.log("FAIL: could not locate function startAudit in site.js"); process.exit(1); }
    if (link > startAudit) {
      console.log("FAIL: audit-forward-link appears only after function startAudit, i.e. on the error path. The SUCCESS path (renderAuditResult) is what C1b is about.");
      process.exit(1);
    }
  ' "$SITE_JS" || fail=1
fi

# The forward step must carry the domain. A bare /signup link makes the visitor
# retype what they just typed into the widget thirty seconds earlier.
#
# Asserted on the BUILDER, not on a literal "signup?domain=" string, because the
# URL is assembled: signupUrl() concatenates the query onto the path, so the two
# halves never appear adjacent in the source. Both halves are required, and the
# success path must go through that one builder rather than hand-rolling a
# second copy that can drift from it.
grep -q "function signupUrl" "$SITE_JS" \
  || note "$SITE_JS has no signupUrl() builder shared by the success and error paths"
grep -q "'?domain=' + encodeURIComponent" "$SITE_JS" \
  || note "$SITE_JS builds a signup URL that does not carry ?domain="
grep -q "signupUrl(domain)" "$SITE_JS" \
  || note "$SITE_JS never calls signupUrl(domain) from the result render"

grep -q '\.audit-forward-link' "$INDEX_HTML" \
  || note "$INDEX_HTML defines no .audit-forward-link style (the link would render unstyled)"

node --check "$SITE_JS" >/dev/null 2>&1 \
  || note "$SITE_JS is not valid JavaScript"

# --- Hop 2: the full report's terminal CTA goes to signup, not to marketing ---
#
# A link to pricing is allowed to remain and deliberately so: a reader who wants
# the price before creating an account is a real person, and bouncing them back
# into signup would be the same dead end pointing the other way. What F5 is about
# is which link is the PRIMARY one, so that is what is asserted: signup must come
# first in the block, and the primary button styling must not be on the pricing
# link.
grep -q '/signup?domain=' "$REPORT_TSX" \
  || note "$REPORT_TSX has no signup link carrying ?domain= (F5)"

node -e '
  const fs = require("fs");
  const src = fs.readFileSync(process.argv[1], "utf8");
  const signup = src.indexOf("/signup?domain=");
  const pricing = src.indexOf("getbrandgeo.com/#pricing");
  if (signup === -1) process.exit(0);              // already reported above
  if (pricing !== -1 && pricing < signup) {
    console.log("FAIL: AuditReport.tsx reaches the marketing pricing anchor before it reaches signup, so pricing is still the primary CTA (F5)");
    process.exit(1);
  }
  // The primary button class must belong to the signup link. Take the 200 chars
  // around each and see which one carries it.
  const near = (i) => src.slice(Math.max(0, i - 200), i + 200);
  const PRIMARY = "bg-brand-500 hover:bg-brand-400";
  if (pricing !== -1 && near(pricing).includes(PRIMARY)) {
    console.log("FAIL: the marketing pricing link in AuditReport.tsx still carries the primary button styling (F5)");
    process.exit(1);
  }
  if (!near(signup).includes(PRIMARY)) {
    console.log("FAIL: the signup link in AuditReport.tsx is not the primary CTA (it lacks " + PRIMARY + ")");
    process.exit(1);
  }
' "$REPORT_TSX" || fail=1

# --- Hops 3 and 4: the domain survives into account setup ---------------------
#
# Both pages must go through the same shared module. Two hand-rolled copies of a
# storage key is how the domain silently stops arriving: one side renames the
# key, the other keeps reading the old one, and nothing errors.
[ -f "$DOMAIN_LIB" ] \
  || note "$DOMAIN_LIB is missing (Signup and Welcome would each need their own copy of the storage key)"

grep -q "signupDomain" "$SIGNUP_TSX" \
  || note "$SIGNUP_TSX does not use the shared signupDomain module"
grep -qE "useSearchParams|URLSearchParams" "$SIGNUP_TSX" \
  || note "$SIGNUP_TSX never reads a query parameter, so ?domain= is dropped on arrival"

grep -q "signupDomain" "$WELCOME_TSX" \
  || note "$WELCOME_TSX does not use the shared signupDomain module, so the carried domain never prefills company setup"

if [ "$fail" = 0 ]; then
  echo "OK: the audit success path, the full report, /signup and /welcome all carry the visitor forward with their domain"
fi
exit $fail
