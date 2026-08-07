#!/usr/bin/env node
// House-style scanner for docs/growth/social/**/*.md and *.txt.
// Checks: em dash (U+2014), en dash (U+2013) except between digits (date/number ranges),
// and the banned-word list from the folder README.
// Usage: node docs/growth/social/_build_check.js <file1> <file2> ...
const fs = require('fs');

const BANNED = [
  'delve', 'unlock', 'unleash', 'elevate', 'harness', 'leverage', 'game-changer',
  'game changer', 'supercharge', 'revolutionize', 'seamless', 'robust',
  'cutting-edge', 'cutting edge', 'transformative', "let's dive in", "it's not just"
];

const files = process.argv.slice(2);
let failed = false;

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const ch of ['—', '–']) {
      let idx = line.indexOf(ch);
      while (idx !== -1) {
        const before = line[idx - 1] || '';
        const after = line[idx + 1] || '';
        const isDigitRange = ch === '–' && /\d/.test(before) && /\d/.test(after);
        if (!isDigitRange) {
          console.log(`${f}:${i + 1}: ${ch === '—' ? 'EM' : 'EN'} DASH: ${line.trim()}`);
          failed = true;
        }
        idx = line.indexOf(ch, idx + 1);
      }
    }
    const lower = line.toLowerCase();
    for (const word of BANNED) {
      if (lower.includes(word)) {
        console.log(`${f}:${i + 1}: BANNED WORD "${word}": ${line.trim()}`);
        failed = true;
      }
    }
    // rhetorical question opener heuristic: line starting a sentence with a question
    // is not auto-flagged (too many false positives), left to manual review.
  });
}

if (!failed) console.log(`OK: ${files.length} file(s), no em/en dash or banned-word hits.`);
process.exit(failed ? 1 : 0);
