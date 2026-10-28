# Daily article routine: the August block is lifted

**Ruling, Constantin, 2026-10-28, verbatim:** "Mergem pe varianta 1."

Variant 1 as offered: lift the block explicitly and run a daily routine, one article a
day, generated from data already collected (the 27 city studies, the bilingual set, the
BG-016 consensus data), committed and pushed automatically through `deploy.php`.

## What this replaces

- The August rule in `.claude/agents/gtm-content.md`, "no new long-form production until
  the staged backlog is fired", no longer applies to the daily research article. Any
  other new long-form still needs its own ruling.
- The 2026-08-14 pacing ruling (one article a day, never a burst) is kept and is what
  this routine implements.

## How it runs

| Part | Where |
|---|---|
| Scheduled task | `brandgeo-daily-article`, every day at 10:10 local time, runs only while the Claude app is open; a missed day runs on next launch |
| Topic queue | `docs/growth/content/article-queue/topics.md` |
| Data records | `docs/growth/content/article-queue/data/` |
| Article content | `scripts/articles_content_daily.py` (`ARTICLES_DAILY`) |
| Renderer | `scripts/build_articles.py` |
| Publisher | `scripts/publish_article.py` |
| Publish log | `docs/growth/content/article-queue/publish-log.md` |

`publish_article.py` renders the page, validates JSON-LD, internal links, dashes and
analytics tags, draws the OG image, adds the blog card and sitemap entry, and makes one
commit built from HEAD plus only its own files. It refuses when local main differs from
origin/main, so it can never push another session's held commit, and it never touches
`brandgeo-dashboard/`, so the push costs no Netlify build. getbrandgeo.com deploys it by
webhook; the script then checks the live page and `deploy-status.json`.

## Limits the routine keeps

- Read-only SQL. It never collects, never calls an engine, never runs an audit.
- No person's name in any article or committed file; the repository is public.
- No em or en dashes, no AI buzzwords, superlatives only after the cross-city ledger.
- A day with no clear finding publishes nothing and says so.

## First article

BG-106, "The Directories AI Engines Name When They Recommend Local Professionals",
published by this routine's publisher on 2026-10-28.
