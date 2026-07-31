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

# --- 3. The ENDPOINT itself refuses, not just the module it imports ----------
#
# Executed, not grepped. An accept-terms.js that requires _terms_gate and then
# ignores what it says would satisfy any number of greps, so the handler is
# invoked directly with an unaccepted request and with a bot submission.
#
# Both of those paths return before the endpoint constructs a Supabase client,
# which is why this needs no credentials, no network and no database.
if [ -f "$ENDPOINT" ]; then
  node --check "$ENDPOINT" >/dev/null 2>&1 || note "$ENDPOINT is not valid JavaScript"
  grep -q "terms_acceptances" "$ENDPOINT" \
    || note "$ENDPOINT writes no terms_acceptances row, so an acceptance leaves no evidence"

  # COVERAGE LIMIT, stated so no reader assumes more than is here. Only the
  # REFUSAL paths are exercised. The allow path inserts a terms_acceptances row
  # before it answers, which needs a database, so an accept-terms.js that
  # returned a URL WITHOUT inserting would still pass this script. That half is
  # covered by the webhook instead: stripe-webhook.js looks the reference up and
  # raises checkout_without_acceptance when it finds nothing.
  (cd brandgeo-dashboard && node -e '
    const gate = require("./netlify/functions/_terms_gate.js");
    const { handler } = require("./netlify/functions/accept-terms.js");
    let bad = 0;
    const fail = (m) => { console.log("FAIL: " + m); bad = 1; };
    const post = (body) => handler({
      httpMethod: "POST",
      headers: { origin: "https://getbrandgeo.com" },
      body: JSON.stringify(body),
    });

    (async () => {
      const cases = [
        ["an unaccepted request", { plan: "growth", period: "monthly", accepted: false, accepted_version: gate.TERMS_VERSION }],
        ["a stale contract version", { plan: "growth", period: "monthly", accepted: true, accepted_version: "1999-01-01" }],
        ["a sales-assisted plan", { plan: "managed", period: "monthly", accepted: true, accepted_version: gate.TERMS_VERSION }],
        ["a bot submission (honeypot filled)", { plan: "growth", period: "monthly", accepted: true, accepted_version: gate.TERMS_VERSION, honeypot: "x" }],
      ];
      for (const [label, body] of cases) {
        let res;
        try { res = await post(body); }
        catch (e) { fail(`accept-terms.js threw on ${label}: ${e.message}`); continue; }
        const text = JSON.stringify(res);
        if (text.includes("buy.stripe.com")) fail(`accept-terms.js returned a checkout URL for ${label}`);
        // The honeypot answers 200 by design, to avoid telling a bot it was
        // caught. What matters for all four is that no URL comes back.
        if (!label.startsWith("a bot") && res.statusCode !== 403) {
          fail(`accept-terms.js answered ${res.statusCode} for ${label}, expected 403`);
        }
      }
      process.exit(bad);
    })();
  ') || fail=1
fi

[ -f "$MIGRATION" ] \
  || note "$MIGRATION is missing (terms_acceptances has no schema on disk)"

# --- 3b. The webhook still consumes the acceptance ---------------------------
#
# While the six payment links remain permanent and published, the webhook is the
# ONLY thing that can tell a gated purchase from a direct one, so it is the whole
# of the enforcement. Nothing else in this script would notice if it were
# refactored away, and it is far from the code it protects.
WEBHOOK="$FN_DIR/stripe-webhook.js"
if [ -f "$WEBHOOK" ]; then
  grep -q "client_reference_id" "$WEBHOOK" \
    || note "$WEBHOOK no longer reads client_reference_id, so a purchase that skipped the contract gate is invisible again"
  grep -q "terms_acceptances" "$WEBHOOK" \
    || note "$WEBHOOK no longer looks up terms_acceptances"
  grep -q "checkout_without_acceptance" "$WEBHOOK" \
    || note "$WEBHOOK no longer raises checkout_without_acceptance"
  # The alert must not send an email: it runs in front of provisioning, and
  # _email.js's fetch has no timeout. A hang there is a paid, unprovisioned
  # customer (see the note in checkContractAcceptance).
  node -e '
    const fs = require("fs");
    const src = fs.readFileSync(process.argv[1], "utf8");
    const i = src.indexOf("checkout_without_acceptance");
    if (i === -1) process.exit(0);   // already reported
    const block = src.slice(i, i + 1600);
    if (!/email:\s*false/.test(block)) {
      console.log("FAIL: the checkout_without_acceptance admin event does not pass email:false. It runs in front of provisioning and _email.js has no fetch timeout, so a hung send means a customer who paid and was never provisioned.");
      process.exit(1);
    }
  ' "$WEBHOOK" || fail=1
fi

# --- 4. The three copies of TERMS_VERSION must agree -------------------------
#
# The version lives in _terms_gate.js (which refuses anything that disagrees with
# it), in site.js (which submits it), and as the effective date on terms.html
# (which is what the buyer actually reads). site.js and _terms_gate.js deploy
# through DIFFERENT pipelines, cPanel and Netlify, so on the next terms update
# whichever lands second gives every buyer a version_mismatch and a "please
# refresh" they cannot act on, because the skew is server to server.
gate_v=$(node -e 'process.stdout.write(String(require("./brandgeo-dashboard/netlify/functions/_terms_gate.js").TERMS_VERSION))' 2>/dev/null || echo "")
site_v=$(grep -oP "var TERMS_VERSION = '\K[^']+" "$SITE_JS" 2>/dev/null || echo "")
terms_v=$(grep -oP 'Effective date:\s*\K[0-9]{1,2} \w+ [0-9]{4}' brandgeo/web/terms.html 2>/dev/null || echo "")
# terms.html prints a human date ("13 July 2026"); normalise to the ISO form the
# other two use rather than requiring the page to change format.
terms_iso=$(node -e '
  const s = process.argv[1];
  if (!s) { process.stdout.write(""); process.exit(0); }
  const d = new Date(s + " UTC");
  process.stdout.write(isNaN(d) ? "" : d.toISOString().slice(0, 10));
' "$terms_v" 2>/dev/null || echo "")

[ -n "$gate_v" ] || note "could not read TERMS_VERSION from _terms_gate.js"
[ -n "$site_v" ] || note "could not read TERMS_VERSION from $SITE_JS"
[ -n "$terms_iso" ] || note "could not read the effective date from brandgeo/web/terms.html"
if [ -n "$gate_v" ] && [ -n "$site_v" ] && [ "$gate_v" != "$site_v" ]; then
  note "TERMS_VERSION disagrees: _terms_gate.js says $gate_v, $SITE_JS says $site_v. Every buyer would get version_mismatch."
fi
if [ -n "$gate_v" ] && [ -n "$terms_iso" ] && [ "$gate_v" != "$terms_iso" ]; then
  note "TERMS_VERSION ($gate_v) does not match terms.html's effective date ($terms_iso). Acceptances would record a contract nobody was shown."
fi

# --- 5. The contract is one click away INSIDE the gate -----------------------
#
# Asserted within the gate panel, not anywhere in the page. A site-wide grep for
# terms.html has passed since long before this gate existed, because the footer
# links it on every page, so it proved nothing about the point of sale.
node -e '
  const fs = require("fs");
  const src = fs.readFileSync(process.argv[1], "utf8");
  const start = src.indexOf("id=\"termsGate\"");
  if (start === -1) { console.log("FAIL: index.html has no #termsGate panel"); process.exit(1); }
  const end = src.indexOf("</div>", src.indexOf("terms-gate-actions", start));
  const panel = src.slice(start, end === -1 ? src.length : end);
  if (!/terms\.html/.test(panel)) {
    console.log("FAIL: the #termsGate panel does not link terms.html, so the contract is not readable at the point of acceptance");
    process.exit(1);
  }
  if (!/type="checkbox"/.test(panel)) {
    console.log("FAIL: the #termsGate panel has no explicit accept checkbox");
    process.exit(1);
  }
' "$INDEX_HTML" || fail=1

if [ "$fail" = 0 ]; then
  echo "OK: no checkout URL is served to the browser, and the server refuses to issue one without a recorded acceptance of $(node -e 'console.log(require("./brandgeo-dashboard/netlify/functions/_terms_gate.js").TERMS_VERSION)')"
fi
exit $fail
