// ============================================================================
// _email.js  --  small shared Resend wrapper with a branded HTML shell.
//
// Until now every function inlined its own Resend fetch + esc() (support-request,
// assistant-lead). This centralises the send and gives transactional mail one
// consistent BrandGEO look (violet header, wordmark, footer). Callers pass plain
// content (heading, paragraphs, optional bullets + CTA); the shell is applied.
//
// ENV: RESEND_API_KEY (missing -> {ok:false, skipped:true}, never throws).
// Sender: BrandGEO <noreply@mail.getbrandgeo.com> (Resend-verified DKIM/SPF/DMARC).
// ============================================================================

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM = 'BrandGEO <noreply@mail.getbrandgeo.com>';
const APP_URL = 'https://app.getbrandgeo.com';

// Two marks, because one asset cannot serve both grounds. The header is violet
// so it needs the white mark; the outer footer is the page background so it
// needs the gradient one. Both are the v3 geometry rendered straight from
// docs/growth/brand-identity-2026-07-29/v3/icon-mark.svg, NOT the retired eye
// mark in brand-kit-2026-07-29/. Both are 102x128 with a transparent ground.
//
// Absolute HTTPS, on the marketing docroot: an email client will not load a
// relative path, a data: URI, or a CID unless it is a real attachment. These
// two files ship via the cPanel webhook, which costs no Netlify build.
const MARK_WHITE  = 'https://getbrandgeo.com/images/brandgeo-mark-white.png';
const MARK_VIOLET = 'https://getbrandgeo.com/images/brandgeo-mark-violet.png';

// Where an opt-out lands. A mailto costs no endpoint and no deploy, and it is a
// valid List-Unsubscribe target under RFC 2369. It is deliberately an address we
// have PROVEN receives mail (the 2026-08-01 self-test landed there) rather than
// a tidier unsubscribe@ that may not exist as an alias: an opt-out that bounces
// is worse than no button, because the recipient believes they opted out.
const UNSUBSCRIBE_MAILTO = 'constantin@getbrandgeo.com';

// Minimal HTML escaper (same behaviour as the copies in support-request.js /
// assistant-lead.js). Escape every value interpolated into the HTML shell.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Optional personal sign-off, rendered under the CTA.
 *
 * Exists because a product update from a no-reply address converts worse than
 * the same words from a person. The sender stays noreply@ (it is the
 * DKIM/SPF/DMARC-verified domain and changing it risks deliverability), and
 * this block plus `replyTo` supply the human end: a face, a name, and two ways
 * to answer.
 *
 * DESIGNED FOR IMAGES OFF, which is the default in Outlook and for any
 * recipient who has not whitelisted us. The name, the role and both buttons are
 * real text and real links, so nothing load-bearing is inside the image. With
 * no avatarUrl at all it draws initials in a violet disc, which is better than
 * a broken-image icon and needs no hosting.
 *
 * Tables, not flexbox: Outlook's Word rendering engine ignores flex and would
 * stack this into a column. width/height attributes are set on the img as
 * ATTRIBUTES as well as CSS for the same reason.
 *
 * signature = { name, role?, avatarUrl?, email?, linkedin? }
 */
function renderSignature(sig) {
  if (!sig || !sig.name) return '';
  const initials = String(sig.name).trim().split(/\s+/).slice(0, 2)
    .map(w => w[0] || '').join('').toUpperCase();

  const face = sig.avatarUrl
    ? `<img src="${esc(sig.avatarUrl)}" alt="${esc(sig.name)}" width="56" height="56" `
      + `style="display:block;width:56px;height:56px;border-radius:28px;object-fit:cover;border:1px solid #e2e8f0;">`
    : `<div style="width:56px;height:56px;border-radius:28px;background:#8b5cf6;color:#ffffff;`
      + `font-size:20px;font-weight:700;line-height:56px;text-align:center;">${esc(initials)}</div>`;

  const buttons = [];
  if (sig.email) {
    buttons.push(
      `<a href="mailto:${esc(sig.email)}" style="display:inline-block;background:#8b5cf6;color:#ffffff;`
      + `text-decoration:none;font-size:13px;font-weight:600;padding:8px 14px;border-radius:8px;margin:0 8px 8px 0;">`
      + `Reply to me</a>`);
  }
  if (sig.linkedin) {
    buttons.push(
      `<a href="${esc(sig.linkedin)}" style="display:inline-block;background:#ffffff;color:#6d28d9;`
      + `text-decoration:none;font-size:13px;font-weight:600;padding:7px 13px;border-radius:8px;`
      + `border:1px solid #c4b5fd;margin:0 8px 8px 0;">Connect on LinkedIn</a>`);
  }

  return `<div style="margin:26px 0 0;padding:18px 0 0;border-top:1px solid #e2e8f0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:12px;vertical-align:top;">${face}</td>
    <td style="vertical-align:middle;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;line-height:1.3;">${esc(sig.name)}</div>
      ${sig.role ? `<div style="font-size:13px;color:#64748b;line-height:1.4;">${esc(sig.role)}</div>` : ''}
      ${sig.email ? `<div style="font-size:13px;line-height:1.4;"><a href="mailto:${esc(sig.email)}" style="color:#6d28d9;text-decoration:none;">${esc(sig.email)}</a></div>` : ''}
    </td>
  </tr></table>
  ${buttons.length ? `<div style="margin-top:12px;">${buttons.join('')}</div>` : ''}
</div>`;
}

/**
 * Opt-out block, rendered below the outer footer line.
 *
 * WHY THIS IS A `kind` FLAG AND NOT A PER-CALLER OPTION. Every marketing send
 * must carry an opt-out; no transactional send should. Leaving that to each
 * caller means the one that forgets is the one that gets the complaint, and the
 * complaint lands on the sending domain, not on the caller. So the decision is
 * made once here, from a single field, and a caller cannot ship marketing mail
 * without it. New marketing email = pass `kind: 'marketing'`, nothing else.
 *
 * The button is a mailto for the same reason the header images are absolute
 * URLs: it has to work with zero infrastructure. When the unsubscribe endpoint
 * exists, add its https URL to `unsubscribeHeaders` below and the RFC 8058
 * one-click header turns on with it. Do NOT send List-Unsubscribe-Post before
 * then: one-click is defined only over https, and a Post header pointing at a
 * mailto is malformed.
 */
function renderUnsubscribe(kind) {
  if (kind !== 'marketing') return '';
  const href = `mailto:${UNSUBSCRIBE_MAILTO}?subject=${encodeURIComponent('Unsubscribe')}`
    + `&body=${encodeURIComponent('Please stop sending me BrandGEO product and pricing updates.')}`;
  return `<p style="margin:12px 4px 0;font-size:11px;line-height:1.6;color:#94a3b8;">
      You are receiving this because you have a BrandGEO account. Product and pricing updates are optional and you can stop them at any time.
    </p>
    <p style="margin:9px 4px 0;">
      <a href="${href}" style="display:inline-block;font-size:11px;font-weight:600;color:#64748b;text-decoration:none;padding:7px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#ffffff;">Unsubscribe</a>
    </p>`;
}

/**
 * The headers that make an opt-out machine-readable.
 *
 * Gmail and Yahoo's bulk-sender rules read List-Unsubscribe, not the button.
 * Without it they surface their own "report spam" instead, and a spam report
 * costs the sending domain reputation in a way an unsubscribe does not.
 */
function unsubscribeHeaders(kind) {
  if (kind !== 'marketing') return undefined;
  return { 'List-Unsubscribe': `<mailto:${UNSUBSCRIBE_MAILTO}?subject=Unsubscribe>` };
}

// Build the branded HTML shell. `paragraphs` and `bullets` are plain strings
// (escaped here). `cta` = { label, url } renders a violet button.
// `signature` = see renderSignature above; omitted by every existing caller, so
// their output is byte-identical to before this was added.
// `kind` = 'transactional' (default) | 'marketing'; see renderUnsubscribe.
function renderShell({ heading, paragraphs = [], bullets = [], cta = null, secondaryCta = null, footerNote = null, signature = null, kind = 'transactional' }) {
  const body = [];
  body.push(
    `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">${esc(heading)}</h1>`,
  );
  for (const p of paragraphs) {
    body.push(`<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${esc(p)}</p>`);
  }
  if (bullets.length) {
    body.push('<ul style="margin:0 0 16px;padding-left:20px;">');
    for (const b of bullets) {
      body.push(`<li style="margin:0 0 6px;font-size:15px;line-height:1.5;color:#334155;">${esc(b)}</li>`);
    }
    body.push('</ul>');
  }
  if (cta && cta.url) {
    // secondaryCta renders beside the primary as an outlined button, for the
    // case where one message legitimately offers two next steps (see the
    // free-plan update: view your results, or upgrade). Optional, so every
    // existing caller renders exactly as before.
    const secondary = secondaryCta && secondaryCta.url
      ? `<a href="${esc(secondaryCta.url)}" style="display:inline-block;background:#ffffff;color:#6d28d9;text-decoration:none;font-size:15px;font-weight:600;padding:10px 21px;border-radius:10px;border:1px solid #c4b5fd;margin-left:8px;">${esc(secondaryCta.label || 'See plans')}</a>`
      : '';
    body.push(
      `<p style="margin:22px 0 8px;"><a href="${esc(cta.url)}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:11px 22px;border-radius:10px;">${esc(cta.label || 'Open BrandGEO')}</a>${secondary}</p>`,
    );
  }
  // Signature sits ABOVE the footer note: the sign-off is part of the message,
  // the footer note is administrative (why you got this, how to stop).
  if (signature) body.push(renderSignature(signature));
  if (footerNote) {
    body.push(`<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${esc(footerNote)}</p>`);
  }

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#8b5cf6;padding:16px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:10px;vertical-align:middle;line-height:0;">
            <img src="${MARK_WHITE}" alt="" width="21" height="26" style="display:block;width:21px;height:26px;border:0;outline:none;text-decoration:none;">
          </td>
          <td style="vertical-align:middle;">
            <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">BrandGEO</span>
          </td>
        </tr></table>
      </div>
      <div style="padding:26px 24px 28px;">${body.join('')}</div>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0;"><tr>
      <td style="padding:0 8px 0 4px;vertical-align:middle;line-height:0;">
        <img src="${MARK_VIOLET}" alt="" width="14" height="18" style="display:block;width:14px;height:18px;border:0;outline:none;text-decoration:none;">
      </td>
      <td style="vertical-align:middle;font-size:11px;line-height:1.5;color:#94a3b8;">
        BrandGEO. AI visibility &amp; brand perception. <a href="${APP_URL}" style="color:#8b5cf6;text-decoration:none;">app.getbrandgeo.com</a>
      </td>
    </tr></table>
    ${renderUnsubscribe(kind)}
  </div>
</body></html>`;
}

// Send a branded email. Returns { ok, skipped?, error? }; never throws.
async function sendBrandedEmail({ to, bcc, subject, heading, paragraphs, bullets, cta, secondaryCta, footerNote, replyTo, signature, kind = 'transactional' }) {
  const key = process.env.RESEND_API_KEY;
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!key) return { ok: false, skipped: true, error: 'RESEND_API_KEY not set' };
  if (!recipients.length) return { ok: false, skipped: true, error: 'no recipient' };
  // bcc is optional and never blocks a send: a bad bcc must not stop the
  // customer receiving their mail.
  const bccList = (Array.isArray(bcc) ? bcc : [bcc]).filter(Boolean);

  const html = renderShell({ heading, paragraphs, bullets, cta, secondaryCta, footerNote, signature, kind });
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: recipients, bcc: bccList.length ? bccList : undefined, reply_to: replyTo || undefined, subject, html, headers: unsubscribeHeaders(kind) }),
    });
    if (!res.ok) {
      let msg = `Resend HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.message || msg; } catch { /* keep status */ }
      return { ok: false, error: msg };
    }
    // Return Resend's message id. It was being thrown away, which meant a send
    // could not be traced afterwards: "did it go, and where did it land" had no
    // answer. Callers that ignore the extra field are unaffected.
    let id = null;
    try { id = (await res.json()).id || null; } catch { /* id is a bonus, not a contract */ }
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

module.exports = { sendBrandedEmail, renderShell, esc, FROM, APP_URL };
