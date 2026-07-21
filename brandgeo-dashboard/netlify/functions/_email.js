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

// Minimal HTML escaper (same behaviour as the copies in support-request.js /
// assistant-lead.js). Escape every value interpolated into the HTML shell.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Build the branded HTML shell. `paragraphs` and `bullets` are plain strings
// (escaped here). `cta` = { label, url } renders a violet button.
function renderShell({ heading, paragraphs = [], bullets = [], cta = null, footerNote = null }) {
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
    body.push(
      `<p style="margin:22px 0 8px;"><a href="${esc(cta.url)}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:11px 22px;border-radius:10px;">${esc(cta.label || 'Open BrandGEO')}</a></p>`,
    );
  }
  if (footerNote) {
    body.push(`<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${esc(footerNote)}</p>`);
  }

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#8b5cf6;padding:18px 24px;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">BrandGEO</span>
      </div>
      <div style="padding:26px 24px 28px;">${body.join('')}</div>
    </div>
    <p style="margin:16px 4px 0;font-size:11px;line-height:1.5;color:#94a3b8;">
      BrandGEO — AI visibility &amp; brand perception. <a href="${APP_URL}" style="color:#8b5cf6;text-decoration:none;">app.getbrandgeo.com</a>
    </p>
  </div>
</body></html>`;
}

// Send a branded email. Returns { ok, skipped?, error? }; never throws.
async function sendBrandedEmail({ to, subject, heading, paragraphs, bullets, cta, footerNote, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!key) return { ok: false, skipped: true, error: 'RESEND_API_KEY not set' };
  if (!recipients.length) return { ok: false, skipped: true, error: 'no recipient' };

  const html = renderShell({ heading, paragraphs, bullets, cta, footerNote });
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: recipients, reply_to: replyTo || undefined, subject, html }),
    });
    if (!res.ok) {
      let msg = `Resend HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.message || msg; } catch { /* keep status */ }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

module.exports = { sendBrandedEmail, renderShell, esc, FROM, APP_URL };
