"""Add the social icon row to every page on getbrandgeo.com.

WHY A SCRIPT AND NOT AGENTS
  82 near-identical edits. The failure mode that matters is drift between files,
  not difficulty per file, so a deterministic pass beats parallel judgement.

TWO FOOTER SHAPES, HANDLED SEPARATELY
  index.html and blog.html already carry `.footer-social` inside `.footer-brand`,
  styled, with LinkedIn in it. Those get the five new anchors appended into the
  existing container and no new CSS.

  The other 80 pages have a minimal `<footer><div class="footer-bottom">` with a
  copyright span and a link row, no social row and no CSS for one. Those get a
  new `.f-social` row plus its rule. A DISTINCT class name is deliberate: reusing
  `.footer-social` would inherit index.html's `.footer-brand` context styling on
  pages that have no such context.

TOKENS
  Two token families are in play across the site: `--t3/--bd/--ac-text` on 57
  pages and `--muted/--border/--accent` on 24. Rather than branch per file, the
  rule uses fallback chains so one snippet is correct in both, with a literal
  hex as the final fallback so it can never render as inherited colour.

SAMEAS IS NOT DONE HERE, ON PURPOSE
  64 pages contain `"@type": "Organization"`, but every one is an inline
  `publisher`/`author`/`creator` stub, not an entity. schema.org wants one
  canonical Organization carrying `sameAs`; index.html already has it. Spraying
  `sameAs` into 64 publisher stubs is noise and buys nothing. index.html is
  handled by the `--sameas` flag.

USAGE
  python inject_social.py --dry-run     report what would change, write nothing
  python inject_social.py --apply       write
  python inject_social.py --apply --sameas   also extend index.html's sameAs
"""

import argparse
import json
import os
import re
import sys

WEB = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "brandgeo", "web"))

# Order is deliberate: LinkedIn first because it is the only account with an
# existing audience and the only one already linked anywhere on the site.
PROFILES = [
    ("LinkedIn",  "https://www.linkedin.com/company/79409681",
     "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"),
    ("X",         "https://x.com/GetBrandGEO",
     "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"),
    ("Instagram", "https://www.instagram.com/brandgeo_global/",
     "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"),
    ("Facebook",  "https://www.facebook.com/profile.php?id=61592342861387",
     "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"),
    ("YouTube",   "https://www.youtube.com/channel/UCc1EXJXm46-_R9qtHSARlWQ",
     "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"),
    ("TikTok",    "https://www.tiktok.com/@brandgeo03",
     "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"),
]

SOCIAL_URLS = [url for _, url, _ in PROFILES]

MARKER = "f-social"

# 32px box holds a 16px glyph. WCAG 2.5.8 sets the minimum target at 24x24 CSS
# px; 32 clears it with room and still reads as a footer utility, not a CTA.
CSS = """
    /* Social row, added 2026-07-29. Fallback chains because the site runs two
       token families: --t3/--bd/--ac-text on most pages, --muted/--border/
       --accent on the older ones. The final hex means this can never fall
       through to an inherited colour. */
    .f-social { display: flex; gap: 8px; align-items: center; }
    .f-social.f-social-center { justify-content: center; margin-top: 16px; }
    /* background and padding are reset explicitly, not left to inherit: at
       least one page (thanks.html) carries a global `a { background: #8b5cf6;
       padding: 12px 28px }` button rule that would otherwise turn every icon
       into a purple slab. */
    .f-social a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background: none;
      border-radius: 8px;
      border: 1px solid var(--bd, var(--border, #2a2c35));
      color: var(--t3, var(--muted, #7d838f));
      text-decoration: none;
      transition: color .15s, border-color .15s;
    }
    .f-social a:hover,
    .f-social a:focus-visible {
      color: var(--ac-text, var(--accent, #a78bfa));
      border-color: var(--ac-text, var(--accent, #a78bfa));
    }
    .f-social svg { display: block; }
"""


def anchor(name, url, path, indent):
    """One icon. aria-label carries the name because the svg is decorative."""
    return (
        f'{indent}<a href="{url}" target="_blank" rel="noopener noreferrer me" aria-label="BrandGEO on {name}">'
        f'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">'
        f'<path d="{path}"/></svg></a>'
    )


def build_row(indent="      ", center=False):
    inner = "\n".join(anchor(n, u, p, indent + "  ") for n, u, p in PROFILES)
    cls = "f-social f-social-center" if center else "f-social"
    return f'{indent}<div class="{cls}">\n{inner}\n{indent}</div>'


def build_extra_anchors(indent):
    """The five new ones only; LinkedIn is already present on these two pages."""
    return "\n".join(anchor(n, u, p, indent) for n, u, p in PROFILES if n != "LinkedIn")


# Internal tool, never uploaded to cPanel, and its footer contains a JS template
# literal (`${new Date()...}`) because the file generates markup. Leave it alone.
EXCLUDE = {"article-builder.html"}


def process(path, apply):
    src = open(path, encoding="utf-8").read()
    name = os.path.relpath(path, WEB).replace("\\", "/")

    if name in EXCLUDE:
        return name, "skip: excluded (internal tool, not deployed)", False
    if MARKER in src or 'aria-label="BrandGEO on X"' in src:
        return name, "skip: already has the row", False

    out = src

    if 'class="footer-social"' in src:
        # index.html / blog.html: append into the styled container that exists.
        m = re.search(r'( *)<div class="footer-social">(.*?)</div>', src, re.S)
        if not m:
            return name, "FAIL: footer-social found but not parseable", False
        indent = m.group(1) + "  "
        block = m.group(0)
        # insert before the container's closing tag
        new_block = block[: block.rindex("</div>")].rstrip("\n") + "\n" + build_extra_anchors(indent) + "\n" + m.group(1) + "</div>"
        out = out.replace(block, new_block, 1)
        note = "appended 5 anchors to existing .footer-social"
    elif '<div class="footer-bottom">' in src:
        m = re.search(r'( *)<div class="footer-bottom">(.*?)\n(\s*)</div>', src, re.S)
        if not m:
            return name, "FAIL: .footer-bottom found but not parseable", False
        indent = m.group(1) + "  "
        close_at = m.end(2)
        out = out[:close_at] + "\n" + build_row(indent) + out[close_at:]
        note = "added .f-social row to .footer-bottom"

    elif "</footer>" in src:
        # Bare footer: a centred <p> or loose text. Row goes last, centred.
        m = re.search(r"( *)</footer>", src)
        indent = m.group(1) + "  "
        out = out.replace(m.group(0), build_row(indent, center=True) + "\n" + m.group(0), 1)
        note = "added centred .f-social row before </footer>"

    elif "</body>" in src:
        # No footer at all (thanks.html). Give it a minimal one rather than
        # hanging the icons off the end of the content box.
        m = re.search(r"( *)</body>", src)
        indent = m.group(1) + "  "
        block = (
            f"{indent}<footer>\n"
            + build_row(indent + "  ", center=True)
            + f"\n{indent}</footer>\n"
        )
        out = out.replace(m.group(0), block + m.group(0), 1)
        note = "added <footer> + centred .f-social row"

    else:
        return name, "FAIL: no footer, no body close", False

    if 'class="footer-social"' not in src:
        if "</style>" not in out:
            return name, "FAIL: no </style> to hold the rule", False
        i = out.rindex("</style>")
        out = out[:i] + CSS + "  " + out[i:]

    if apply:
        open(path, "w", encoding="utf-8", newline="").write(out)
    return name, note, True


def add_sameas(apply):
    """Extend index.html's top-level Organization sameAs, formatting preserved."""
    p = os.path.join(WEB, "index.html")
    src = open(p, encoding="utf-8").read()
    missing = [u for u in SOCIAL_URLS if u not in src.split("</head>")[0]]
    if not missing:
        return "sameAs: already complete"
    # the org-level sameAs is the one holding the LinkedIn company URL
    key = '"sameAs": [\n          "https://www.linkedin.com/company/79409681",'
    if key not in src:
        return "sameAs: FAIL, anchor not found"
    add = "".join(f'\n          "{u}",' for u in missing)
    out = src.replace(key, key + add, 1)
    if apply:
        open(p, "w", encoding="utf-8", newline="").write(out)
    return f"sameAs: added {len(missing)} url(s)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sameas", action="store_true")
    a = ap.parse_args()
    if not (a.apply or a.dry_run):
        sys.exit("pass --dry-run or --apply")

    files = []
    for root, _, names in os.walk(WEB):
        for n in sorted(names):
            if n.endswith(".html"):
                files.append(os.path.join(root, n))

    ok = fail = skip = 0
    for f in files:
        name, note, changed = process(f, a.apply)
        if note.startswith("FAIL"):
            fail += 1
            print(f"  FAIL  {name}: {note}")
        elif not changed:
            skip += 1
        else:
            ok += 1
    print(f"\n{len(files)} files: {ok} changed, {skip} skipped, {fail} failed")
    if a.sameas:
        print(add_sameas(a.apply))
    if a.dry_run:
        print("(dry run, nothing written)")


if __name__ == "__main__":
    main()
