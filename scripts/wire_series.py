"""Wire BG-027 to BG-034 into blog.html and sitemap.xml.

The card grid and the sitemap are rebuilt by INSERTION at a known anchor, not
by hand editing, for the reason recorded in the BG-025 merge: a mis-resolved
hunk in an interleaved card list silently drops live articles, and nothing
tells you.

The OG card doubles as the post-card visual. The existing cards use
/images/bg-0NN-hero.png, which these eight do not have; /images/og/og-bg-0NN.png
does exist and is 1200x630, the same aspect the visual is cropped to anyway.
"""

import io
import re

WEB = r"C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web"

SERIES = [
    ("bg-034", "BG-034", "The Multilingual AI Visibility Checklist",
     "Nine things that decide whether an AI engine can answer about you in a second language, ordered by effort against effect. Two of them are usually already broken.",
     "Checklist &middot; Multilingual &middot; August 2026", "Aug 1, 2026"),
    ("bg-033", "BG-033", "How to Check Whether AI Recommends Your Brand in Your Customers' Language",
     "The same test we ran across four cities, reduced to ten minutes by hand, plus the three mistakes that make people conclude the wrong thing from it.",
     "How To &middot; Multilingual &middot; August 2026", "Aug 1, 2026"),
    ("bg-032", "BG-032", "Which AI Engine Changes Its Answer Most When You Change the Language",
     "Claude rewrote its list almost completely between languages. Perplexity held on to the most names. The spread is smaller than anyone hoping for a safe engine would like.",
     "Engines &middot; Multilingual &middot; August 2026", "Aug 1, 2026"),
    ("bg-031", "BG-031", "In Italian, AI Recommends the Trattoria. In English, It Recommends the Three-Star",
     "Rome's two answers shared 18% of the companies they named. Italian returned the neighbourhood operator, English returned the internationally famous name.",
     "Italy &middot; Research &middot; August 2026", "Aug 1, 2026"),
    ("bg-030", "BG-030", "Ask in French and AI Names French Independents. Ask in English and It Names Global Banks",
     "The sharpest single result in the study. Paris wealth management returned two almost entirely separate industries, and the six firms in both had one thing in common.",
     "France &middot; Research &middot; August 2026", "Aug 1, 2026"),
    ("bg-029", "BG-029", "Madrid Had the Smallest AI Language Gap in Europe, and One Category Explains Why",
     "Spanish and English agreed more in Madrid than anywhere else measured. Almost all of that came from one category dominated by international hotel chains.",
     "Spain &middot; Research &middot; August 2026", "Aug 1, 2026"),
    ("bg-028", "BG-028", "Ask AI in German, Get a Lawyer. Ask in English, Get a Law Firm",
     "Berlin had the widest language gap of the four cities: 8.9% overlap. German named individual Rechtsanwaelte, English named CMS, GOERG and Beiten Burkhardt.",
     "Germany &middot; Research &middot; August 2026", "Aug 1, 2026"),
    ("bg-027", "BG-027", "We Asked AI the Same Question in Two Languages. 82% of the Companies It Named Appeared in Only One",
     "Four European cities, 486 companies named, 87 in both languages. Your AI visibility is not one number. It is one number per language.",
     "Multilingual &middot; Research &middot; August 2026", "Aug 1, 2026"),
]


def post_card(slug, bid, title, hook, tag):
    return f"""    <a href="/{slug}.html" class="post-card">
      <div class="post-card-visual has-image" style="background-image: linear-gradient(180deg, rgba(10,10,15,.2) 0%, rgba(10,10,15,.8) 100%), url('/images/og/og-{slug}.png');">
        <span class="post-card-id">{bid}</span>
        <span class="post-card-status status-published">Published</span>
      </div>
      <div class="post-card-body">
        <h4>{title}</h4>
        <p>{hook}</p>
        <div class="post-card-footer">
          <span class="post-card-tag">{tag}</span>
          <span class="post-card-link">Read &rarr;</span>
        </div>
      </div>
    </a>

"""


def latest_card(slug, title, hook, date):
    return f"""    <a href="/{slug}.html" class="latest-card">
      <div class="latest-card-top">
        <span class="latest-tag latest-tag-research">Research</span>
        <span class="latest-date">{date}</span>
      </div>
      <h5>{title}</h5>
      <p>{hook}</p>
    </a>
"""


def main():
    p = WEB + r"\blog.html"
    s = io.open(p, encoding="utf-8").read()
    if "bg-027.html" in s:
        print("blog.html already wired, skipping")
    else:
        # Post grid: insert before the first existing post-card.
        anchor = s.index('    <a href="/bg-026.html" class="post-card">')
        cards = "".join(post_card(sl, b, t, h, tag) for sl, b, t, h, tag, _ in SERIES)
        s = s[:anchor] + cards + s[anchor:]

        # "Latest" rail: only the flagship and the two practical pieces, so the
        # rail does not become eight near-identical entries.
        a2 = s.index('    <a href="/bg-026.html" class="latest-card">')
        pick = [x for x in SERIES if x[0] in ("bg-027", "bg-033", "bg-034")]
        rail = "".join(latest_card(sl, t, h, d) for sl, _b, t, h, _tag, d in reversed(pick))
        s = s[:a2] + rail + s[a2:]
        io.open(p, "w", encoding="utf-8", newline="").write(s)
        print(f"blog.html: {len(SERIES)} post cards + {len(pick)} latest cards")

    # Sitemap
    p = WEB + r"\sitemap.xml"
    s = io.open(p, encoding="utf-8").read()
    if "bg-027.html" in s:
        print("sitemap already wired, skipping")
        return
    m = re.search(r"[ \t]*<url>\s*<loc>https://getbrandgeo\.com/bg-026\.html</loc>.*?</url>\n", s, re.S)
    if not m:
        raise SystemExit("sitemap: bg-026 entry not found, refusing to guess an insertion point")
    entries = "".join(
        f"""  <url>
    <loc>https://getbrandgeo.com/{sl}.html</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

""" for sl, *_ in reversed(SERIES))
    s = s[:m.start()] + entries + s[m.start():]
    s = s.replace("<loc>https://getbrandgeo.com/blog.html</loc>\n    <lastmod>2026-07-09</lastmod>",
                  "<loc>https://getbrandgeo.com/blog.html</loc>\n    <lastmod>2026-08-01</lastmod>")
    io.open(p, "w", encoding="utf-8", newline="").write(s)
    print(f"sitemap.xml: {len(SERIES)} urls added, blog.html lastmod bumped")


if __name__ == "__main__":
    main()
