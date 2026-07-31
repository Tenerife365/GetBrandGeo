#!/usr/bin/env bash
# Verifies that payment is unreachable until the buyer has accepted the contract,
# and that the gate is enforced by the SERVER (ROADMAP.md Stream C item C3).
#
# THE POINT OF THIS SCRIPT IS THAT A UI-ONLY GATE MUST FAIL IT.
#
# A disabled button, a required checkbox, an `aria-disabled`, a click handler
# that returns early: none of those gate anything. The payment URL is still in
# the page, so the buyer reaches Stripe by reading the source, by an old
# bookmark, or by a browser that ran none of the JavaScript. C3 says the gate
# "must be enforced server-side too, not only by a disabled button, or it is
# decorative", so this script asks two questions a markup check cannot:
#
#   1. Is the checkout URL absent from everything the browser is served?
#      If buy.stripe.com is anywhere in brandgeo/web/, payment is reachable
#      right now and no amount of UI can make it otherwise.
#
#   2. Does the server refuse to issue a checkout URL when acceptance is
#      missing? This is executed, not grepped: _terms_gate.js is required into
#      node and called with acceptance absent, with a stale contract version,
#      and with a plan nobody may self-serve. Each must come back with no URL
#      in the response at all.
#
# _terms_gate.js is pure by design (no I/O, no Supabase, no env) for exactly this
# reason, following the pattern _package_checkout.js established: the harness
# exercises the code the endpoint runs, not a paraphrase of it.
#
# Exit 0 when the gate holds; exit 1 and name each offender otherwise.
set -euo pipefail
cd "$(dirname "$0")/.."

FN_DIR="brandgeo-dashboard/netlify/functions"
GATE="$FN_DIR/_terms_gate.js"
ENDPOINT="$FN_DIR/accept-terms.js"
INDEX_HTML="brandgeo/web/index.html"
SITE_JS="brandgeo/web/site.js"
MIGRATION="db/supabase-terms-acceptances-migration.sql"

fail=0
note() { echo "FAIL: $*"; fail=1; }

# --- 1. The checkout URL must not be served to the browser -------------------
#
# Scoped to brandgeo/web/ (the cPanel docroot) rather than the whole repo: the
# links legitimately live in the server-side gate module and in the Stripe
# catalogue script, neither of which a visitor is ever served.
if grep -rIl "buy\.stripe\.com" brandgeo/web/ >/dev/null 2>&1; then
  echo "FAIL: a Stripe checkout URL is present in files served to the browser, so payment is reachable without accepting anything:"
  grep -rIln "buy\.stripe\.com" brandgeo/web/ | sed 's/^/       /'
  fail=1
fi

# The old client-side link map is the specific shape of that defect. Matched as a
# DECLARATION, not as the bare word: site.js documents in a comment why the map
# was removed and where the links went, and that comment is the main thing
# standing between the next person and reintroducing it.
if grep -qE "STRIPE_LINKS\s*=" "$SITE_JS"; then
  note "$SITE_JS still declares a client-side STRIPE_LINKS map; the checkout URL must come from the server, per request, after acceptance"
fi

# --- 2. The server refuses to issue a URL without acceptance ------------------
[ -f "$GATE" ] || note "$GATE is missing (there is no server-side gate to enforce)"
[ -f "$ENDPOINT" ] || note "$ENDPOINT is missing (nothing issues a checkout URL)"

if [ -f "$GATE" ]; then
  node -e '
    const path = require("path");
    const gate = require(path.resolve(process.argv[1]));
    let bad = 0;
    const fail = (m) => { console.log("FAIL: " + m); bad = 1; };

    if (!gate.TERMS_VERSION || !String(gate.TERMS_VERSION).trim()) {
      fail("_terms_gate.js exports no TERMS_VERSION, so an acceptance records no contract");
    }
    if (typeof gate.resolveCheckout !== "function") {
      fail("_terms_gate.js exports no resolveCheckout()");
      process.exit(1);
    }

    const V = gate.TERMS_VERSION;
    // A response is only safe if the URL is absent from the WHOLE object, not
    // just from a .url field. A refusal that still echoes the link in a detail
    // string or a debug field has leaked the thing it refused.
    const leaks = (r) => JSON.stringify(r).includes("buy.stripe.com");

    const refusals = [
      ["acceptance absent",        { plan: "growth", period: "monthly", accepted: false, acceptedVersion: V }],
      ["acceptance undefined",     { plan: "growth", period: "monthly", acceptedVersion: V }],
      ["accepted is a truthy string, not true", { plan: "growth", period: "monthly", accepted: "yes", acceptedVersion: V }],
      ["stale contract version",   { plan: "growth", period: "monthly", accepted: true, acceptedVersion: "1999-01-01" }],
      ["no contract version",      { plan: "growth", period: "monthly", accepted: true }],
      ["plan that is not self-serve", { plan: "managed", period: "monthly", accepted: true, acceptedVersion: V }],
      ["plan that does not exist", { plan: "nonsense", period: "monthly", accepted: true, acceptedVersion: V }],
      ["period that does not exist", { plan: "growth", period: "weekly", accepted: true, acceptedVersion: V }],
    ];

    for (const [label, input] of refusals) {
      let r;
      try { r = gate.resolveCheckout(input); }
      catch (e) { fail(`resolveCheckout threw on ${label}: ${e.message} (it must refuse, not throw: this runs on a money path)`); continue; }
      if (r && r.ok) fail(`resolveCheckout ALLOWED checkout with ${label}`);
      if (r && r.url) fail(`resolveCheckout returned a url with ${label}`);
      if (leaks(r)) fail(`resolveCheckout leaked a checkout URL in its refusal for ${label}`);
      if (r && !r.ok && !r.reason) fail(`resolveCheckout refused ${label} without a reason, so the endpoint cannot say why`);
    }

    // And the happy path must still work, or the gate is just an outage.
    for (const period of ["monthly", "annual"]) {
      for (const plan of ["essentials", "growth", "growth_pro"]) {
        const r = gate.resolveCheckout({ plan, period, accepted: true, acceptedVersion: V });
        if (!r || !r.ok) { fail(`resolveCheckout REFUSED a valid accepted ${plan}/${period} checkout: ${r && r.reason}`); continue; }
        if (!/^https:\/\/buy\.stripe\.com\//.test(r.url || "")) {
          fail(`resolveCheckout allowed ${plan}/${period} but returned no Stripe URL`);
        }
      }
    }
    process.exit(bad);
  ' "$GATE" || fail=1
fi

# --- 3. The endpoint records WHO accepted WHAT, and when ---------------------
if [ -f "$ENDPOINT" ]; then
  node --check "$ENDPOINT" >/dev/null 2>&1 || note "$ENDPOINT is not valid JavaScript"
  grep -q "_terms_gate" "$ENDPOINT" \
    || note "$ENDPOINT does not use _terms_gate.js, so it has its own ungated copy of the decision"
  grep -q "terms_acceptances" "$ENDPOINT" \
    || note "$ENDPOINT writes no terms_acceptances row, so an acceptance leaves no evidence"
fi

[ -f "$MIGRATION" ] \
  || note "$MIGRATION is missing (terms_acceptances has no schema on disk)"

# --- 4. The contract itself is one click away at the point of sale -----------
grep -q "terms.html" "$INDEX_HTML" \
  || note "$INDEX_HTML does not link terms.html, so there is nothing to read before accepting"

if [ "$fail" = 0 ]; then
  echo "OK: no checkout URL is served to the browser, and the server refuses to issue one without a recorded acceptance of $(node -e 'console.log(require("./brandgeo-dashboard/netlify/functions/_terms_gate.js").TERMS_VERSION)')"
fi
exit $fail
