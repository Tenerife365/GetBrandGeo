# Supabase Auth email templates (BrandGEO branded)

The signup invite, password reset, and magic-link emails are sent by **Supabase Auth**,
not by `netlify/functions/_email.js` (that one only powers admin/notification mail). So
they use their own templates, which start out plain/unbranded. Paste the HTML below to
match the BrandGEO look (violet `#8b5cf6` header, wordmark, slate body, violet button),
identical to the `_email.js` shell.

Customer-facing, so no em dashes (project rule).

## Where to paste
Supabase Dashboard -> **Authentication -> Emails -> Templates**. For each template below,
set the **Subject** and replace the **Message body (HTML)**, then Save. `{{ .ConfirmationURL }}`
is Supabase's action-link variable; keep it exactly as written.

## Deliverability note (do this too, or the branding is undercut)
By default Supabase sends these from its own shared mail service (generic sender,
tight rate limits). To send them from your verified `noreply@mail.getbrandgeo.com`
(the same Resend identity `_email.js` uses, with DKIM/SPF/DMARC), set **Authentication ->
Emails -> SMTP Settings** to your Resend SMTP:
host `smtp.resend.com`, port `465`, user `resend`, password = your `RESEND_API_KEY`,
sender `noreply@mail.getbrandgeo.com`, sender name `BrandGEO`.

---

## 1. Invite user  (the signup / onboarding invite — highest priority)

**Subject:** `You're invited to BrandGEO`

```html
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#8b5cf6;padding:18px 24px;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">BrandGEO</span>
      </div>
      <div style="padding:26px 24px 28px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">You're invited to BrandGEO</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">Welcome. BrandGEO shows you how your brand appears in AI answers across ChatGPT, Gemini, Claude, and more.</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">Click below to set your password and finish setting up your account.</p>
        <p style="margin:22px 0 8px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:11px 22px;border-radius:10px;">Set your password</a></p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">If you didn't expect this invite, you can safely ignore this email.</p>
      </div>
    </div>
    <p style="margin:16px 4px 0;font-size:11px;line-height:1.5;color:#94a3b8;">BrandGEO. AI visibility and brand perception. <a href="https://app.getbrandgeo.com" style="color:#8b5cf6;text-decoration:none;">app.getbrandgeo.com</a></p>
  </div>
</body>
</html>
```

---

## 2. Reset password  (Forgot-password, and the invite -> set-password redirect)

**Subject:** `Reset your BrandGEO password`

```html
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#8b5cf6;padding:18px 24px;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">BrandGEO</span>
      </div>
      <div style="padding:26px 24px 28px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Reset your password</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">We received a request to reset the password for your BrandGEO account. Click below to choose a new one.</p>
        <p style="margin:22px 0 8px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:11px 22px;border-radius:10px;">Choose a new password</a></p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">If you didn't request this, you can ignore this email and your password stays the same.</p>
      </div>
    </div>
    <p style="margin:16px 4px 0;font-size:11px;line-height:1.5;color:#94a3b8;">BrandGEO. AI visibility and brand perception. <a href="https://app.getbrandgeo.com" style="color:#8b5cf6;text-decoration:none;">app.getbrandgeo.com</a></p>
  </div>
</body>
</html>
```

---

## 3. Magic link  (passwordless sign-in, if enabled)

**Subject:** `Your BrandGEO sign-in link`

```html
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#8b5cf6;padding:18px 24px;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">BrandGEO</span>
      </div>
      <div style="padding:26px 24px 28px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Your sign-in link</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">Click below to sign in to BrandGEO. This link works once and expires shortly.</p>
        <p style="margin:22px 0 8px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:11px 22px;border-radius:10px;">Sign in to BrandGEO</a></p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">If you didn't request this, you can ignore this email.</p>
      </div>
    </div>
    <p style="margin:16px 4px 0;font-size:11px;line-height:1.5;color:#94a3b8;">BrandGEO. AI visibility and brand perception. <a href="https://app.getbrandgeo.com" style="color:#8b5cf6;text-decoration:none;">app.getbrandgeo.com</a></p>
  </div>
</body>
</html>
```

---

## 4. Confirm signup  (not used today, since signup uses invite. Brand it anyway for completeness.)

**Subject:** `Confirm your BrandGEO account`

```html
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#8b5cf6;padding:18px 24px;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">BrandGEO</span>
      </div>
      <div style="padding:26px 24px 28px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a;font-weight:700;">Confirm your account</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">Thanks for signing up for BrandGEO. Confirm your email to activate your account.</p>
        <p style="margin:22px 0 8px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:11px 22px;border-radius:10px;">Confirm my account</a></p>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">If you didn't create a BrandGEO account, you can ignore this email.</p>
      </div>
    </div>
    <p style="margin:16px 4px 0;font-size:11px;line-height:1.5;color:#94a3b8;">BrandGEO. AI visibility and brand perception. <a href="https://app.getbrandgeo.com" style="color:#8b5cf6;text-decoration:none;">app.getbrandgeo.com</a></p>
  </div>
</body>
</html>
```
