#!/usr/bin/env bash
# check-greeting-clock.sh — roadmap B3. The dashboard greeting must read the
# VIEWER's local clock, not UTC, and must label the day correctly at every
# boundary.
#
# This replaces the roadmap's original B3 check, which grepped for
# getTimezoneOffset or toLocaleTimeString. That check asserted a particular
# implementation rather than correct behaviour: the greeting is already correct
# without either symbol, so the old check could only be satisfied by adding code
# that does nothing. See docs/loop-log.md, cycle 5.
set -u
cd "$(dirname "$0")/.."

node -e '
const fs = require("fs");
const file = "brandgeo-dashboard/src/pages/Dashboard.tsx";
const src = fs.readFileSync(file, "utf8");

const m = src.match(/const greeting = \(\(\) => \{([\s\S]*?)\}\)\(\)/);
if (!m) {
  console.error("FAIL: could not locate the greeting expression in " + file);
  process.exit(1);
}
const body = m[1];

// A UTC clock source is the exact defect B3 was filed to look for.
for (const utcish of ["getUTCHours", "toISOString", "toUTCString"]) {
  if (body.includes(utcish)) {
    console.error("FAIL: the greeting reads " + utcish + ", which is UTC, not the viewer local clock");
    process.exit(1);
  }
}
if (!body.includes("getHours")) {
  console.error("FAIL: the greeting does not read getHours(); local-clock behaviour is unproven");
  process.exit(1);
}

// Evaluate the real labelling logic at each boundary by substituting the hour.
const expr = body.replace(/const h = new Date\(\)\.getHours\(\)/, "const h = HOUR");
const expected = [
  [0,  "Good morning"],
  [11, "Good morning"],
  [12, "Good afternoon"],
  [17, "Good afternoon"],
  [18, "Good evening"],
  [23, "Good evening"],
];
let bad = 0;
for (const [h, want] of expected) {
  const got = new Function(expr.replace("HOUR", String(h)))();
  const ok = got === want;
  if (!ok) bad++;
  console.log((ok ? "  ok   - " : "  FAIL - ") + String(h).padStart(2, "0") + ":00 local -> " + got + (ok ? "" : " (expected " + want + ")"));
}
if (bad) {
  console.error("FAIL: " + bad + " greeting boundary case(s) wrong");
  process.exit(1);
}
console.log("OK: the dashboard greeting reads the viewer local clock and labels every boundary correctly");
'
