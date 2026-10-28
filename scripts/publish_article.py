"""Publish one daily article end to end: render, validate, OG image, blog and
sitemap entries, one commit, push, live check.

Used by the scheduled routine brandgeo-daily-article and safe to run by hand.

    python scripts/publish_article.py --slug bg-107                 # dry run: writes files, stages nothing
    python scripts/publish_article.py --slug bg-107 --commit        # also one commit on main
    python scripts/publish_article.py --slug bg-107 --commit --push --verify

WHY IT COMMITS THROUGH A TEMPORARY INDEX

  Several Claude sessions work in this tree at once and leave files dirty,
  sitemap.xml included. `git add` or `git commit -a` would sweep their work
  into this commit. So the commit is built from HEAD plus exactly the files
  this script writes: blog.html and sitemap.xml are rebuilt from the HEAD
  blob with only our insertion applied, so a foreign hunk in the working
  copy never rides along. The real index is touched only for these paths,
  and only where nobody else has staged something there.

WHY IT REFUSES WHEN MAIN IS NOT EXACTLY origin/main

  A push sends every unpushed commit. Another session's held commit (a
  dashboard change waiting for a batch build, a draft) must never go out
  because an article did. If local main and origin/main differ, the script
  stops before writing anything that git would see.

EXIT CODES
  0 ok, 2 bad input, 3 git state refuses, 4 validation failed, 5 push failed,
  6 published but the live check did not confirm within the time budget.
"""

import argparse
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
sys.path.insert(0, SCRIPTS)

BLOG = "brandgeo/web/blog.html"
SITEMAP = "brandgeo/web/sitemap.xml"
LOG = "docs/growth/content/article-queue/publish-log.md"
DASHES = re.compile("[\u2013\u2014]")
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
ATTRIBUTION = "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"


def die(code, msg):
    print("REFUSED: " + msg if code in (2, 3, 4) else "FAILED: " + msg)
    sys.exit(code)


def git(*args, env=None, inp=None, check=True):
    r = subprocess.run(["git", *args], cwd=ROOT, env=env, input=inp,
                       capture_output=True)
    if check and r.returncode != 0:
        die(5 if args[0] == "push" else 3,
            "git " + " ".join(args) + " -> " + r.stderr.decode("utf-8", "replace").strip())
    return r.stdout


def head_text(path):
    return git("show", "HEAD:" + path).decode("utf-8")


def nl_of(text):
    return "\r\n" if "\r\n" in text else "\n"


def load_article(slug):
    from articles_content_daily import ARTICLES_DAILY
    for a in ARTICLES_DAILY:
        if a["slug"] == slug:
            return a
    die(2, f"{slug} is not in scripts/articles_content_daily.py")


# ---------------------------------------------------------------- snippets

def short_date(a):
    y, m, d = a["date"].split("-")
    return f"{MONTHS[int(m) - 1][:3]} {int(d)}, {y}"


def latest_card(a):
    return [
        f'    <a href="/{a["slug"]}.html" class="latest-card">',
        '      <div class="latest-card-top">',
        '        <span class="latest-tag latest-tag-research">Research</span>',
        f'        <span class="latest-date">{short_date(a)}</span>',
        '      </div>',
        f'      <h5>{a["title"]}</h5>',
        f'      <p>{a["subtitle"]}</p>',
        '    </a>',
    ]


def post_card(a):
    y, m, _ = a["date"].split("-")
    tagline = f'{a["tags"][0]} &middot; {a["tags"][-1]} &middot; {MONTHS[int(m) - 1]} {y}'
    return [
        f'    <a href="/{a["slug"]}.html" class="post-card">',
        f'      <div class="post-card-visual has-image" style="background-image: linear-gradient(180deg, rgba(10,10,15,.2) 0%, rgba(10,10,15,.8) 100%), url(\'/images/og/og-{a["slug"]}.png\');">',
        f'        <span class="post-card-id">{a["bid"]}</span>',
        '        <span class="post-card-status status-published">Published</span>',
        '      </div>',
        '      <div class="post-card-body">',
        f'        <h4>{a["title"]}</h4>',
        f'        <p>{a["subtitle"]}</p>',
        '        <div class="post-card-footer">',
        f'          <span class="post-card-tag">{tagline}</span>',
        '          <span class="post-card-link">Read &rarr;</span>',
        '        </div>',
        '      </div>',
        '    </a>',
        '',
    ]


def sitemap_entry(a):
    return [
        '  <url>',
        f'    <loc>https://getbrandgeo.com/{a["slug"]}.html</loc>',
        f'    <lastmod>{a["date"]}</lastmod>',
        '    <changefreq>monthly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
    ]


# ---------------------------------------------------------------- inserts

def insert_blog(text, a):
    nl = nl_of(text)
    lines = text.split(nl)
    try:
        g = next(i for i, l in enumerate(lines) if l.strip() == '<div class="latest-grid">')
        p = next(i for i, l in enumerate(lines) if l.strip() == '<div class="posts-grid">')
    except StopIteration:
        die(4, "blog.html: latest-grid or posts-grid anchor not found")
    # Latest grid keeps ten cards: drop the last card before the grid closes.
    starts = [i for i in range(g, p) if 'class="latest-card"' in lines[i]]
    if len(starts) >= 10:
        s = starts[-1]
        e = next(i for i in range(s, p) if lines[i].strip() == "</a>")
        del lines[s:e + 1]
        p -= (e + 1 - s)
    lines[g + 1:g + 1] = latest_card(a)
    p += len(latest_card(a))
    # posts-grid is followed by one blank line, then the newest card.
    first = next(i for i in range(p, len(lines)) if 'class="post-card"' in lines[i])
    lines[first:first] = post_card(a)
    return nl.join(lines)


def insert_sitemap(text, a):
    nl = nl_of(text)
    lines = text.split(nl)
    end = max(i for i, l in enumerate(lines) if l.strip() == "</urlset>")
    # keep the blank line that precedes </urlset>, if there is one
    at = end - 1 if lines[end - 1].strip() == "" else end
    lines[at:at] = sitemap_entry(a)
    return nl.join(lines)


# ---------------------------------------------------------------- checks

def validate_page(html, a):
    problems = []
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            json.loads(m.group(1))
        except ValueError as e:
            problems.append(f"JSON-LD does not parse: {e}")
    if html.count('application/ld+json') < 2:
        problems.append("expected at least 2 JSON-LD blocks")
    if DASHES.search(html):
        problems.append("em or en dash in the page")
    if re.search(r"<script[^>]*googletagmanager|gtag\(\s*['\"](js|config)", html):
        problems.append("raw analytics tag in the page (consent breach)")
    for rel in re.findall(r'href="/([^"#?]+\.html)"', html):
        if not os.path.exists(os.path.join(ROOT, "brandgeo", "web", rel)):
            problems.append(f"internal link to a missing page: /{rel}")
    if f'og-{a["slug"]}.png' not in html:
        problems.append("OG image path missing")
    return problems


def make_og(a):
    gen = os.path.join(SCRIPTS, "og_image_generator_bg055_104.py")
    src = io.open(gen, encoding="utf-8").read()
    # Only the definitions: every top-level make(...) call below them would
    # regenerate fifty old images.
    cut = re.search(r"^make\(", src, re.M)
    ns = {}
    exec(compile(src[:cut.start()] if cut else src, gen, "exec"), ns)
    o = a["og"]
    ns["make"](o["fname"], o["kicker"], o["lines"], o["sub"], o["stats"], o["footer"])
    return "brandgeo/web/images/og/" + o["fname"]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "BrandGEO-publish-check/1.0",
                                               "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, r.read().decode("utf-8", "replace")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--push", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--extra", nargs="*", default=[],
                    help="repo-relative files only the routine edits, committed whole "
                         "(topics.md, the data note, articles_content_daily.py)")
    args = ap.parse_args()
    slug = args.slug.lower()
    a = load_article(slug)

    # git state first: nothing is written if the push could not be clean.
    if os.path.exists(os.path.join(ROOT, ".git", "index.lock")):
        die(3, ".git/index.lock exists: another git process is running")
    if git("rev-parse", "--abbrev-ref", "HEAD").decode().strip() != "main":
        die(3, "not on main")
    git("fetch", "-q", "origin", "main")
    head = git("rev-parse", "HEAD").decode().strip()
    remote = git("rev-parse", "origin/main").decode().strip()
    if head != remote:
        die(3, f"local main {head[:7]} differs from origin/main {remote[:7]}: "
               "another session holds unpushed or unpulled commits")

    blog_head, map_head = head_text(BLOG), head_text(SITEMAP)
    if f'href="/{slug}.html"' in blog_head or f"/{slug}.html</loc>" in map_head:
        die(3, f"{slug} is already on blog.html or in sitemap.xml at HEAD")

    from build_articles import render
    html = render(a)
    page = f"brandgeo/web/{slug}.html"
    snippets = "\n".join(latest_card(a) + post_card(a) + sitemap_entry(a))
    problems = validate_page(html, a)
    if DASHES.search(snippets):
        problems.append("em or en dash in a blog or sitemap snippet")
    for p in args.extra:
        full = os.path.join(ROOT, p)
        if not os.path.isfile(full):
            problems.append(f"--extra file missing: {p}")
        elif DASHES.search(io.open(full, encoding="utf-8").read()):
            problems.append(f"em or en dash in {p}")
    if problems:
        die(4, "; ".join(problems))

    io.open(os.path.join(ROOT, page), "w", encoding="utf-8", newline="").write(html)
    og = make_og(a)

    # Working copy: our insertion on top of whatever is there.
    blog_new_head = insert_blog(blog_head, a)
    map_new_head = insert_sitemap(map_head, a)
    for path, fn in ((BLOG, insert_blog), (SITEMAP, insert_sitemap)):
        full = os.path.join(ROOT, path)
        cur = io.open(full, encoding="utf-8", newline="").read()
        if f"/{slug}.html" in cur:
            continue  # a dry run already put it in the working copy
        io.open(full, "w", encoding="utf-8", newline="").write(fn(cur, a))
    print(f"wrote {page}, {og}, and the {slug} entries in blog.html and sitemap.xml")

    if not args.commit:
        print("dry run: nothing staged or committed")
        return

    # Log line rides in the same commit.
    log_full = os.path.join(ROOT, LOG)
    os.makedirs(os.path.dirname(log_full), exist_ok=True)
    if not os.path.exists(log_full):
        io.open(log_full, "w", encoding="utf-8").write(
            "# Daily article publish log\n\nOne line per published article, newest last.\n\n")
    io.open(log_full, "a", encoding="utf-8").write(
        f"- {a['date']} {a['bid']} https://getbrandgeo.com/{slug}.html {a['title']}\n")

    blobs = {
        BLOG: git("hash-object", "-w", "--no-filters", "--stdin",
                  inp=blog_new_head.encode("utf-8")).decode().strip(),
        SITEMAP: git("hash-object", "-w", "--no-filters", "--stdin",
                     inp=map_new_head.encode("utf-8")).decode().strip(),
    }
    for p in [page, og, LOG] + list(args.extra):
        blobs[p] = git("hash-object", "-w", "--", p).decode().strip()

    fd, tmp_index = tempfile.mkstemp(prefix="publish-index-")
    os.close(fd)
    os.remove(tmp_index)
    env = dict(os.environ, GIT_INDEX_FILE=tmp_index)
    try:
        git("read-tree", "HEAD", env=env)
        for p, sha in blobs.items():
            git("update-index", "--add", "--cacheinfo", f"100644,{sha},{p}", env=env)
        tree = git("write-tree", env=env).decode().strip()
    finally:
        if os.path.exists(tmp_index):
            os.remove(tmp_index)
    msg = (f"feat(web): {a['bid']} {a['title']}\n\n"
           f"Published by scripts/publish_article.py. Files: {page}, {og}, "
           f"the {slug} cards in blog.html and its sitemap entry, the publish log.\n\n"
           f"{ATTRIBUTION}\n")
    commit = git("commit-tree", tree, "-p", head, inp=msg.encode("utf-8")).decode().strip()
    git("update-ref", "refs/heads/main", commit, head)

    # Real index: move our paths to the new blobs unless someone staged them.
    for p, sha in blobs.items():
        cur = git("ls-files", "-s", "--", p).decode().split()
        if not cur or cur[1] == git("rev-parse", f"{head}:{p}", check=False).decode().strip():
            git("update-index", "--add", "--cacheinfo", f"100644,{sha},{p}")
    print(f"committed {commit[:7]} on main")

    if not args.push:
        return
    git("push", "origin", "main")
    print(f"pushed {commit[:7]}")

    if not args.verify:
        return
    deadline = time.time() + 240
    page_ok = status_ok = False
    while time.time() < deadline and not (page_ok and status_ok):
        time.sleep(20)
        try:
            code, body = fetch(f"https://getbrandgeo.com/{slug}.html?v={commit[:7]}")
            page_ok = code == 200 and a["bid"] in body and a["title"].split()[1] in body
            _, st = fetch("https://getbrandgeo.com/deploy-status.json")
            s = json.loads(st)
            status_ok = str(s.get("sha", "")).startswith(commit[:7]) and not s.get("failed")
        except Exception as e:  # noqa: BLE001
            print("live check retry:", e)
    print(f"live page {'OK' if page_ok else 'NOT CONFIRMED'}, "
          f"deploy-status {'OK' if status_ok else 'NOT CONFIRMED'}")
    if not (page_ok and status_ok):
        sys.exit(6)


if __name__ == "__main__":
    main()
