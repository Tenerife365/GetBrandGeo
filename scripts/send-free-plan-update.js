#!/usr/bin/env node
/**
 * send-free-plan-update.js
 *
 * Sends the free-plan Gemini update to one recipient, BCC Constantin.
 * Copy deck and the evidence for every claim: docs/copy/free-plan-gemini-update.md
 *
 * RUNS LOCALLY. NO NETLIFY DEPLOY REQUIRED. That is the whole point of this
 * file: `_email.js` is a plain CommonJS module that talks to Resend over HTTPS,
 * so it works from a laptop exactly as it does from a Lambda. The bcc and
 * secondaryCta support it uses is committed but undeployed, which does not
 * matter here because this script requires the local file.
 *
 * WHY CONSTANTIN RUNS THIS AND NOT AN AGENT: it needs RESEND_API_KEY. Handling
 * a secret is withheld from the loop by docs/AUTONOMY.md section 2, and no
 * agent should ever hold that key.
 *
 *   DRY RUN (prints the HTML, sends nothing, needs no key):
 *     node scripts/send-free-plan-update.js --dry-run
 *
 *   SEND FOR REAL:
 *     set RESEND_API_KEY=re_xxx        (PowerShell: $env:RESEND_API_KEY="re_xxx")
 *     node scripts/send-free-plan-update.js --send
 *
 * Sending twice sends twice. There is no idempotency here; check before re-running.
 */

const path = require('path');
const fsx = require('fs');
const { sendBrandedEmail, renderShell } = require(
  path.join(__dirname, '..', 'brandgeo-dashboard', 'netlify', 'functions', '_email.js')
);

// ── Load the key from the gitignored .env files, so it never has to be typed ──
// A PowerShell $env: assignment lives only for that one window, which is how a
// --send silently turned into "nothing was sent": the key was set in one shell
// and the script was run in another. Put RESEND_API_KEY in
// brandgeo-dashboard/.env once (matched by .gitignore line 12, verified) and
// every run picks it up. Values are never printed by this script.
for (const rel of ['brandgeo-dashboard/.env.local', 'brandgeo-dashboard/.env', '.env']) {
  const p = path.join(__dirname, '..', rel);
  if (!fsx.existsSync(p)) continue;
  for (const line of fsx.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;                                   // blank line or comment
    if (process.env[m[1]] !== undefined) continue;      // a real env var always wins
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

// ── Recipient ────────────────────────────────────────────────────────────────
// Ai Fy, client 26, the only live free account. Verified 2026-07-31: 2 active
// prompts, both collected on Gemini at 14:41 for EUR 0.064, so "we re-ran all
// your prompts" is literally true rather than nearly true.
const TO   = 'a.hoefelmeyer@gmail.com';
const BCC  = 'constantin@getbrandgeo.com';   // project-domain rule, see memory
const BRAND = 'Ai Fy';
const PROMPT_COUNT = 'both';                 // they have exactly 2

const EMAIL = {
  to: TO,
  bcc: BCC,
  replyTo: 'constantin@getbrandgeo.com',
  subject: 'Your free plan just got better, and we re-ran your results',
  heading: 'Your free plan now runs on Gemini',
  paragraphs: [
    'Hi there,',
    'Small update on your free BrandGEO account, and some good news attached to it.',
    'We have moved the free plan from ChatGPT to Google Gemini. The reason is simple: on the free tier the old setup ran out of budget partway through a first collection, so some accounts never saw a complete result. Gemini fits comfortably, which means every free account now finishes every run.',
    `We did not want you to wait for your weekly refresh to see the difference, so we have already re-run ${PROMPT_COUNT} of your prompts on Gemini, at no cost to you and without using your refresh. Your results are live in your dashboard now.`,
    `What that shows you is where ${BRAND} does and does not come up when someone asks Gemini the questions your buyers actually ask. If you are missing from an answer, that is the gap worth closing, and it is the thing we are built to track.`,
    'We would genuinely like your feedback. You are one of the first people using this, so what you find confusing or missing carries real weight right now. Reply to this email and it comes straight to me.',
    // Radar is LIVE and buyable as of 2026-07-31, so this names it and prices
    // it. Deliberately argued on the second engine and the prompt count, NOT on
    // tracking change over time: scheduled collection currently overwrites the
    // previous run rather than accumulating it, so a trend claim would not be
    // true yet. See the council item on scheduled-collection history.
    'One more thing, since you are early. We have just launched Radar, a small paid tier that sits between the free plan and Essentials. It adds Claude alongside Gemini, so you see where you stand on two engines rather than one, and it raises you from 5 prompts to 7. It is EUR 29 a month for the first 100 customers, then EUR 39.',
  ],
  cta:          { label: 'View your results', url: 'https://app.getbrandgeo.com' },
  secondaryCta: { label: 'See Radar',         url: 'https://getbrandgeo.com/#pricing' },
  signature: {
    name:      'Constantin Goane',
    role:      'Founder, BrandGEO',
    email:     'constantin@getbrandgeo.com',
    linkedin:  'https://www.linkedin.com/in/daniel-geo/',
    avatarUrl: 'https://getbrandgeo.com/images/constantin.jpg',
  },
  footerNote: 'You are receiving this because you have a free BrandGEO account. Reply to this email if you would prefer not to receive product updates.',
};

async function main() {
  const mode = process.argv.includes('--send') ? 'send'
             : process.argv.includes('--self-test') ? 'self'
             : process.argv.includes('--dry-run') ? 'dry'
             : process.argv.includes('--status') ? 'status'
             : null;

  if (!mode) {
    console.error('Refusing to run without an explicit mode.\n'
      + '  --dry-run     write the HTML, send nothing, no key needed\n'
      + '  --self-test   send the real email to Constantin ONLY, no customer involved\n'
      + '  --send        send to the customer, BCC Constantin\n'
      + '  --status <id> ask Resend what happened to a previous send');
    process.exit(2);
  }

  // FAIL LOUDLY AND FIRST. This check used to sit below the "to: / bcc: /
  // subject:" banner and print one quiet line before exiting 1, which read like
  // a successful run to anyone skimming. A --send was reported as having "gone
  // well" when in fact nothing left the machine and no customer was emailed.
  // Missing credentials must never look like a send.
  if (mode !== 'dry' && !process.env.RESEND_API_KEY) {
    console.error('\n' + '='.repeat(68));
    console.error('  NOTHING WAS SENT. RESEND_API_KEY is not set.');
    console.error('='.repeat(68));
    console.error('\nNo email left this machine. No customer was contacted.\n');
    console.error('Put the key in the gitignored env file once and it is picked up');
    console.error('by every future run, including from a fresh shell:\n');
    console.error('  brandgeo-dashboard/.env      add a line:  RESEND_API_KEY=re_...\n');
    console.error('The key lives in Netlify under Site settings, Environment variables.');
    console.error('Do not commit it and do not paste it into a chat.\n');
    process.exit(1);
  }

  // Ask Resend for the fate of a message id. This is the only way to tell
  // "never sent" apart from "sent and filtered", which is the question a
  // missing BCC always raises.
  if (mode === 'status') {
    const id = process.argv[process.argv.indexOf('--status') + 1];
    if (!id || id.startsWith('--')) { console.error('--status needs a message id'); process.exit(2); }
    if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY is not set.'); process.exit(1); }
    const r = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const j = await r.json().catch(() => ({}));
    console.log(`HTTP ${r.status}`);
    if (!r.ok) {
      // Exit non-zero. A lookup that returns 400 or 401 and still exits 0 is the
      // same silent-success shape that hid the unsent email in the first place.
      console.error(`LOOKUP FAILED: ${j.message || j.name || 'no detail returned'}`);
      console.error(r.status === 401 || r.status === 403
        ? 'The key was rejected. Check RESEND_API_KEY.'
        : 'Check the message id. Resend ids look like a UUID.');
      process.exit(1);
    }
    console.log(JSON.stringify({ id: j.id, to: j.to, bcc: j.bcc, from: j.from, subject: j.subject, last_event: j.last_event, created_at: j.created_at }, null, 2));
    return;
  }

  // SELF TEST. Same message, same sender, same shell, but Constantin is the TO
  // and there is no BCC and no customer. It answers one question and only one:
  // can this mailbox receive mail from Resend at all? If this lands, the send
  // path works and a missing BCC is a filtering problem. If it does not land,
  // the problem is the mailbox or the domain, and nothing about BCC.
  if (mode === 'self') {
    EMAIL.to = EMAIL.bcc;
    delete EMAIL.bcc;
    EMAIL.subject = `[self test] ${EMAIL.subject}`;
  }

  console.log(`to:       ${EMAIL.to}`);
  console.log(`bcc:      ${EMAIL.bcc || '(none)'}`);
  console.log(`reply-to: ${EMAIL.replyTo}`);
  console.log(`subject:  ${EMAIL.subject}\n`);

  if (mode === 'dry') {
    const html = renderShell(EMAIL);
    const out = path.join(__dirname, '..', 'email-preview.html');
    require('fs').writeFileSync(out, html);
    console.log(`DRY RUN. Nothing sent. ${html.length} bytes of HTML written to:\n  ${out}\nOpen it in a browser to check it, then re-run with --send.`);
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set, so nothing was sent.');
    process.exit(1);
  }

  const res = await sendBrandedEmail(EMAIL);
  if (res.ok) {
    console.log(`SENT. Resend id: ${res.id || '(none returned)'}`);
    console.log('Keep that id. Trace it later with:');
    console.log(`  node scripts/send-free-plan-update.js --status ${res.id || '<id>'}`);
  } else {
    console.error('NOT SENT:', res.error || 'unknown error', res.skipped ? '(skipped)' : '');
    process.exit(1);
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
