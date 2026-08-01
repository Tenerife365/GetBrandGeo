"""Build BrandGEO research articles from one shared template.

WHY A GENERATOR AND NOT EIGHT HAND-WRITTEN FILES

  Every bg-*.html page is roughly 290 lines, of which about 140 are an
  identical <style> block and another 40 are an identical nav and footer.
  Hand-copying that eight times is how the six pre-consent gtag tags got in:
  a page written after a site-wide sweep inherits the state of whatever page
  was copied, not the state of the site. One template means one place to fix.

WHAT IS DELIBERATELY NOT PARAMETERISED

  The call to action. Every page gets the same button, pointing at
  /#free-audit, because that is the site-wide target and an article-specific
  variant is exactly the kind of drift this file exists to prevent.

USAGE
  python scripts/build_articles.py            # write all
  python scripts/build_articles.py --only bg-027
"""

import argparse
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "brandgeo", "web")

STYLE = """    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg: #0a0a0f; --surface: #13131a; --border: #22223a; --accent: #6c63ff; --accent2: #00d4aa; --text: #e8e8f0; --muted: #8888aa; --radius: 12px; }
    [data-theme="light"] { --bg: #f5f5fa; --surface: #ffffff; --border: #dddde8; --text: #0a0a1e; --muted: #666688; }
    [data-theme="light"] nav { background: rgba(245,245,250,0.92); }
    body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.6; transition: background .3s, color .3s; }
    nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: rgba(10,10,15,0.92); backdrop-filter: blur(12px); z-index: 100; }
    .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .logo-text { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
    .logo-text .brand { color: var(--text); }
    .logo-text .geo { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    nav a { color: var(--muted); text-decoration: none; font-size: 0.95rem; margin-left: 32px; transition: color .2s; }
    nav a:hover { color: var(--text); }
    .nav-cta { background: var(--accent); color: #fff !important; padding: 8px 20px; border-radius: 8px; font-weight: 600; }
    .theme-toggle { background: none; border: 1px solid var(--border); color: var(--muted); cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; transition: border-color .2s, color .2s; margin-left: 16px; flex-shrink: 0; }
    .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
    .article-header { max-width: 820px; margin: 0 auto; padding: 64px 40px 48px; }
    .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--muted); margin-bottom: 32px; flex-wrap: wrap; }
    .breadcrumb a { color: var(--muted); text-decoration: none; }
    .breadcrumb a:hover { color: var(--accent); }
    .breadcrumb-sep { color: var(--border); }
    .article-badges { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
    .badge-research { display: inline-flex; align-items: center; gap: 6px; background: rgba(108,99,255,.12); border: 1px solid rgba(108,99,255,.3); color: var(--accent); padding: 5px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
    .badge-id { font-size: 0.78rem; font-weight: 700; color: var(--accent2); border: 1px solid rgba(0,212,170,.25); padding: 5px 14px; border-radius: 20px; }
    .badge-tag { font-size: 0.75rem; color: var(--muted); border: 1px solid var(--border); padding: 4px 12px; border-radius: 20px; }
    .article-header h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 900; line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px; }
    .article-header h1 em { font-style: normal; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .article-subtitle { font-size: 1.2rem; color: var(--muted); line-height: 1.6; margin-bottom: 32px; }
    .article-meta { display: flex; align-items: center; gap: 24px; padding-top: 24px; border-top: 1px solid var(--border); flex-wrap: wrap; }
    .meta-item { font-size: 0.85rem; color: var(--muted); }
    .meta-item strong { color: var(--text); }
    .findings-bar { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 32px 40px; }
    .findings-inner { max-width: 820px; margin: 0 auto; }
    .findings-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent2); margin-bottom: 20px; }
    .findings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; }
    .finding-number { font-size: 2rem; font-weight: 900; letter-spacing: -1px; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 6px; }
    .finding-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.4; }
    .article-body { max-width: 820px; margin: 0 auto; padding: 56px 40px 80px; }
    .article-body h2 { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; margin: 48px 0 16px; line-height: 1.25; }
    .article-body h2:first-child { margin-top: 0; }
    .article-body h3 { font-size: 1.15rem; font-weight: 700; margin: 32px 0 12px; color: var(--text); }
    .article-body p { color: #c8c8d8; font-size: 1.02rem; line-height: 1.75; margin-bottom: 20px; }
    [data-theme="light"] .article-body p, [data-theme="light"] .article-body li { color: #33334d; }
    .article-body strong { color: var(--text); font-weight: 700; }
    .article-body em { color: var(--accent2); font-style: normal; }
    .article-body ul, .article-body ol { padding-left: 24px; margin-bottom: 20px; }
    .article-body li { color: #c8c8d8; font-size: 1.02rem; line-height: 1.7; margin-bottom: 8px; }
    .article-body li strong { color: var(--text); }
    .article-body a { color: var(--accent2); text-decoration: none; border-bottom: 1px solid rgba(0,212,170,.35); }
    .article-body a:hover { border-bottom-color: var(--accent2); }
    .article-body code { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; font-size: 0.9em; font-family: 'Cascadia Code', Consolas, monospace; color: var(--accent2); }
    .callout { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: var(--radius); padding: 24px 28px; margin: 32px 0; }
    .callout.teal { border-left-color: var(--accent2); }
    .callout-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 8px; }
    .callout.teal .callout-label { color: var(--accent2); }
    .callout p { color: var(--text); font-size: 0.95rem; margin: 0; }
    .callout p + p { margin-top: 12px; }
    .callout a { color: var(--accent2); }
    .compare-table { width: 100%; border-collapse: collapse; margin: 8px 0 32px; font-size: 0.92rem; }
    .compare-table th, .compare-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); vertical-align: top; }
    .compare-table th { color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    .compare-table td { color: #c8c8d8; line-height: 1.5; }
    [data-theme="light"] .compare-table td { color: #33334d; }
    .compare-table td:first-child { color: var(--text); font-weight: 700; }
    .compare-table tr:last-child td { border-bottom: none; }
    .compare-table-wrap { overflow-x: auto; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 8px 0 8px; }
    .related-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-decoration: none; display: block; transition: border-color .2s, transform .2s; }
    .related-card:hover { border-color: var(--accent); transform: translateY(-2px); }
    .related-id { font-size: 0.72rem; font-weight: 700; color: var(--accent2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .related-title { font-size: 0.95rem; font-weight: 700; color: var(--text); line-height: 1.4; margin-bottom: 6px; }
    .related-hook { font-size: 0.82rem; color: var(--muted); line-height: 1.5; }
    .cta-box { background: linear-gradient(135deg, rgba(108,99,255,.15) 0%, rgba(0,212,170,.08) 100%); border: 1px solid rgba(108,99,255,.3); border-radius: 20px; padding: 48px; text-align: center; margin-top: 64px; }
    .cta-box h3 { font-size: 1.6rem; font-weight: 800; margin-bottom: 12px; }
    .cta-box p { color: var(--muted); margin-bottom: 28px; max-width: 480px; margin-left: auto; margin-right: auto; }
    .btn-primary { display: inline-block; background: var(--accent); color: #fff; padding: 14px 32px; border-radius: var(--radius); font-size: 1rem; font-weight: 700; text-decoration: none; transition: transform .2s, box-shadow .2s; box-shadow: 0 4px 20px rgba(108,99,255,.4); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(108,99,255,.5); }
    .btn-secondary { display: inline-block; background: transparent; color: var(--text); padding: 13px 30px; border-radius: var(--radius); font-size: 1rem; font-weight: 700; text-decoration: none; border: 1px solid var(--border); transition: border-color .2s; margin-left: 12px; }
    .btn-secondary:hover { border-color: var(--accent2); }
    .cta-note { font-size: 0.82rem; color: var(--muted); margin-top: 16px; }
    footer { border-top: 1px solid var(--border); padding: 32px 40px; color: var(--muted); font-size: 0.88rem; }
    .footer-bottom { max-width: 820px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .footer-bottom a { color: var(--muted); text-decoration: none; }
    .footer-bottom a:hover { color: var(--text); }
    @media(max-width:640px) {
      nav { padding: 16px 20px; }
      /* `:not(.logo)` is load bearing: the header lockup is also `nav a`, so
         without the guard the mark and wordmark vanish on every phone. */
      nav a:not(.nav-cta):not(.logo) { display: none; }
      /* Measured at 375 CSS px: hiding the text links is not enough on its
         own. The lockup alone is 177px and the CTA group 167px, which is
         384px of content in a 360px viewport, so the page scrolls sideways.
         Every existing article on this site does exactly that (bg-026 scrolls
         146px, bg-019 scrolls 428px). Shrinking the three surviving elements
         is what takes it to zero. */
      .logo img { height: 28px !important; }
      .logo-text { font-size: 1.05rem; }
      .nav-cta { margin-left: 12px; padding: 7px 14px; font-size: 0.88rem; white-space: nowrap; }
      .theme-toggle { margin-left: 8px; width: 32px; height: 32px; }
      .article-header, .article-body, .findings-bar { padding-left: 20px; padding-right: 20px; }
      .cta-box { padding: 32px 24px; }
      .btn-secondary { margin-left: 0; margin-top: 12px; }
      .compare-table { font-size: 0.85rem; }
      .compare-table th, .compare-table td { padding: 10px; }
    }"""

NAV = """<nav>
  <a href="/" class="logo">
    <img src="/logo-nav.png" alt="BrandGEO icon" style="height:36px;width:auto;display:block;">
    <div class="logo-text"><span class="brand">Brand</span><span class="geo">GEO</span></div>
  </a>
  <div style="display:flex;align-items:center;">
    <a href="/#how">How it works</a>
    <a href="/#pricing">Pricing</a>
    <a href="/faq.html">FAQ</a>
    <a href="/blog.html">Research</a>
    <a href="/news/">News</a>
    <!-- "Free test", not "Test my website free". The long label was measured
         overflowing the nav by 46px at 375 CSS px: below 640 the other nav
         links are hidden, but the logo, the CTA and the theme toggle still
         have to fit, and the long label does not. The in-body CTA buttons
         keep the full wording, where there is room for it. -->
    <a href="/#free-audit" class="nav-cta">Free test</a>
    <button class="theme-toggle" id="themeBtn" aria-label="Toggle light/dark mode">&#x1F319;</button>
  </div>
</nav>"""

# The one call to action, identical on every page it generates. See the module
# docstring: this is deliberately not per-article.
CTA = """  <div class="cta-box">
    <h3>{cta_h}</h3>
    <p>{cta_p}</p>
    <a href="/#free-audit" class="btn-primary">Test my website free</a>
    <a href="/#pricing" class="btn-secondary">See plans from &euro;0</a>
    <p class="cta-note">No signup and no card for the test. The free plan stays free after it.</p>
  </div>"""

FOOTER = """<footer>
  <div class="footer-bottom">
    <span>&copy; 2026 BrandGEO &nbsp;&middot;&nbsp; <a href="/">getbrandgeo.com</a></span>
    <div style="display:flex;gap:16px;">
      <a href="/blog.html">Research</a>
      <a href="/news/">News</a>
      <a href="/privacy.html">Privacy</a>
    </div>
  </div>
</footer>"""


def render(a):
    slug = a["slug"]
    url = f"https://getbrandgeo.com/{slug}.html"
    ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": a["h1_plain"],
        "description": a["ld_desc"],
        "datePublished": a["date"],
        "dateModified": a["date"],
        "inLanguage": "en",
        "isAccessibleForFree": True,
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "author": {"@type": "Organization", "name": "BrandGEO Research"},
        "publisher": {"@type": "Organization", "name": "BrandGEO", "url": "https://getbrandgeo.com"},
        "about": a["about"],
    }
    blocks = [json.dumps(ld, indent=2, ensure_ascii=False)]
    if a.get("faq"):
        blocks.append(json.dumps({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": ans}}
                for q, ans in a["faq"]
            ],
        }, indent=2, ensure_ascii=False))
    blocks.append(json.dumps({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://getbrandgeo.com/"},
            {"@type": "ListItem", "position": 2, "name": "Research", "item": "https://getbrandgeo.com/blog.html"},
            {"@type": "ListItem", "position": 3, "name": a["bid"], "item": url},
        ],
    }, indent=2, ensure_ascii=False))
    ld_html = "\n".join(
        '  <script type="application/ld+json">\n' + b + "\n  </script>" for b in blocks
    )

    findings = "\n".join(
        f'      <div class="finding">\n'
        f'        <div class="finding-number">{n}</div>\n'
        f'        <div class="finding-desc">{d}</div>\n'
        f"      </div>"
        for n, d in a["findings"]
    )
    related = "\n".join(
        f'    <a href="{href}" class="related-card">\n'
        f'      <div class="related-id">{rid}</div>\n'
        f'      <div class="related-title">{t}</div>\n'
        f'      <div class="related-hook">{h}</div>\n'
        f"    </a>"
        for href, rid, t, h in a["related"]
    )
    tags = "\n".join(f'    <span class="badge-tag">{t}</span>' for t in a["tags"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{a['bid']}: {a['title']} | BrandGEO Research&trade;</title>
  <meta name="description" content="{a['meta_desc']}">
  <meta name="keywords" content="{a['keywords']}">
  <meta property="og:title" content="{a['h1_plain']}: BrandGEO Research&trade;">
  <meta property="og:description" content="{a['og_desc']}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://getbrandgeo.com/images/og/og-{slug}.png">
  <meta property="og:url" content="{url}">
  <link rel="canonical" href="{url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://getbrandgeo.com/images/og/og-{slug}.png">
  <meta property="article:published_time" content="{a['date']}">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0b0e">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f7f7fc">
{ld_html}
  <style>
{STYLE}
  </style>
  <!-- GA4 loads from ga4-init.js ONLY after consent. Do not add a raw
       googletagmanager gtag tag here; that is what 399723c removed site wide. -->
  <script src="/ga4-init.js?v=20260801"></script>
</head>
<body>

{NAV}

<div class="article-header">
  <div class="breadcrumb">
    <a href="/">getbrandgeo.com</a>
    <span class="breadcrumb-sep">/</span>
    <a href="/blog.html">Research</a>
    <span class="breadcrumb-sep">/</span>
    <span>{a['bid']}</span>
  </div>
  <div class="article-badges">
    <span class="badge-research">BrandGEO Research&trade;</span>
    <span class="badge-id">{a['bid']}</span>
{tags}
  </div>
  <h1>{a['h1']}</h1>
  <p class="article-subtitle">{a['subtitle']}</p>
  <div class="article-meta">
    <span class="meta-item"><strong>BrandGEO Research</strong></span>
    <span class="meta-item">{a['date_label']}</span>
    <span class="meta-item">{a['read']} min read</span>
    <span class="meta-item">Research ID: <strong>{a['bid']}</strong></span>
  </div>
</div>

<div class="findings-bar">
  <div class="findings-inner">
    <div class="findings-label">&#9679; Key findings: {a['bid']}</div>
    <div class="findings-grid">
{findings}
    </div>
  </div>
</div>

<div class="article-body">
{a['body']}

  <div class="findings-label" style="margin:48px 0 16px;">&#9679; Related research</div>
  <div class="related-grid">
{related}
  </div>

{CTA.format(cta_h=a['cta_h'], cta_p=a['cta_p'])}
</div>

{FOOTER}

<script src="/site.js"></script>
</body>
</html>
"""


def main():
    from articles_content import ARTICLES  # noqa: E402
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    n = 0
    for a in ARTICLES:
        if args.only and a["slug"] not in args.only and a["bid"].lower() not in args.only:
            continue
        out = os.path.join(WEB, a["slug"] + ".html")
        io.open(out, "w", encoding="utf-8", newline="").write(render(a))
        print(f"  wrote {a['slug']}.html  {a['bid']}  {a['title'][:58]}")
        n += 1
    print(f"\n{n} articles written")


if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
