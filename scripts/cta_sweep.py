"""Site-wide CTA sweep for getbrandgeo.com.

THREE DEFECTS THIS CLOSES

  1. Every article CTA pointed at `/#contact`, the 48-hour manual request form.
     The product has an INSTANT audit in the homepage hero. The weaker promise
     was the one on 77 pages. Repointed to `/#free-audit`.

  2. Nine pages plus five newsroom pages carried no call to action at all. A
     reader who finished the page had nowhere to go.

  3. Six pages (bg-020, bg-022 to bg-026) load Google Analytics from a raw
     gtag tag BEFORE consent. Commit 399723c removed exactly this from the
     other 79 pages on 2026-07-29; these six were added afterwards and
     reintroduced it. `ga4-init.js` already loads GA after consent, so the raw
     tag is removed, not replaced.

WHAT IS DELIBERATELY NOT TOUCHED

  The nav "Get started" button still points at `/#contact`. Nav is a
  navigation affordance, not the page's call to action, and #contact is a real
  destination for someone who wants a person rather than a scan.
"""

import io
import os
import re
import sys

WEB = r"C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web"

# Pages that get no CTA injected: legal boilerplate and terminal pages where a
# sales button is either noise or actively wrong.
NO_CTA = {"cookies.html", "privacy.html", "terms.html", "thanks.html", "welcome.html",
          "article-builder.html", "index.html"}  # relative paths; news/*/index.html is NOT here

CTA_LIGHT = """
<div style="max-width:820px;margin:0 auto;padding:0 40px 64px;">
  <div style="background:linear-gradient(135deg, rgba(108,99,255,.15) 0%, rgba(0,212,170,.08) 100%);border:1px solid rgba(108,99,255,.3);border-radius:20px;padding:40px 32px;text-align:center;">
    <h3 style="font-size:1.45rem;font-weight:800;margin-bottom:12px;">Test your website for free</h3>
    <p style="color:var(--muted,#8888aa);margin:0 auto 24px;max-width:480px;">See what ChatGPT, Gemini, Claude and Perplexity actually say when someone asks for a company like yours. No signup, no card, results on screen.</p>
    <a href="/#free-audit" style="display:inline-block;background:#6c63ff;color:#fff;padding:14px 32px;border-radius:12px;font-size:1rem;font-weight:700;text-decoration:none;box-shadow:0 4px 20px rgba(108,99,255,.4);">Test my website free &rarr;</a>
    <p style="font-size:0.82rem;color:var(--muted,#8888aa);margin-top:16px;">Free plan available after the test. No commitment.</p>
  </div>
</div>
"""


def sweep(path):
    name = os.path.basename(path)
    rel = os.path.relpath(path, WEB).replace("\\", "/")
    src = io.open(path, encoding="utf-8").read()
    orig = src
    notes = []

    # 1. Repoint existing CTA buttons. Only inside a cta-box, and only the
    #    primary button, so the nav and body links are untouched.
    def repoint(m):
        return m.group(0).replace('href="/#contact"', 'href="/#free-audit"')

    new = re.sub(r'<div class="cta-box">.*?</div>\s*(?=\n)', repoint, src, flags=re.S)
    if new != src:
        notes.append("cta->audit")
        src = new

    # Rewrite the primary CTA label so it says what the button does.
    for old, repl in [
        ("Request your free AI Visibility audit", "Test my website free"),
        ("Request your free AI visibility audit", "Test my website free"),
        ("Request a free AI Visibility audit", "Test my website free"),
        ("Request your free audit", "Test my website free"),
    ]:
        if old in src:
            src = src.replace(old, repl)
            notes.append("label")

    # 2. Strip the pre-consent gtag loader. ga4-init.js stays.
    g = re.sub(r'\s*<script async src="https://www\.googletagmanager\.com/gtag/js\?id=[^"]+"></script>', "", src)
    if g != src:
        notes.append("gtag-removed")
        src = g

    # 3. Inject a CTA where there is none.
    # Keyed on the RELATIVE path, not the basename. Keying on the basename
    # silently exempted all five newsroom pages, because every one of them is
    # called index.html.
    if "cta-box" not in src and "Test my website free" not in src and rel not in NO_CTA:
        anchor = src.rfind("<footer")
        if anchor == -1:
            notes.append("SKIP-no-footer")
        else:
            src = src[:anchor] + CTA_LIGHT + "\n" + src[anchor:]
            notes.append("cta-injected")

    if src != orig:
        io.open(path, "w", encoding="utf-8", newline="").write(src)
        print(f"  {rel:52s} {' '.join(notes)}")
        return True
    return False


def main():
    targets = []
    for root, _dirs, files in os.walk(WEB):
        for f in files:
            if f.endswith(".html"):
                targets.append(os.path.join(root, f))
    changed = sum(1 for t in sorted(targets) if sweep(t))
    print(f"\n{changed} of {len(targets)} pages changed")


if __name__ == "__main__":
    main()
