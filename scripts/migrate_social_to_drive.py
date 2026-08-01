#!/usr/bin/env python3
"""
migrate_social_to_drive.py

Copies finished social posts out of the repo and into the shared Google Drive,
in the structure Constantin ruled on 2026-08-01.

  G:\\My Drive\\BrandGEO Social Media\\
    1-Pending\\<Month-DD-YYYY-focus>\\<channel>\\<format>\\<post>\\
        post.json
        caption.txt
        assets\\...
    2-Posted\\        (a whole campaign folder is moved here once it has gone out)

WHY THE REPO IS NOT THE HOME FOR THIS. It is public, its history is permanent,
and none of this is ever served by the site. See the .gitignore block and the
memory note social-output-not-in-git.

RULES THIS ENCODES, each one a decision rather than a preference:

  scored beats silent. Those two ARE the same post with audio on and off, so the
  silent copy is a variant and it is dropped. 52 files.

  The nine timestamped runs are NOT variants. Their captions are nine different
  arguments, so all nine survive as nine posts. This was nearly got wrong.

  A carousel is ONE post. instagram feed-01 s1..s4 and linkedin li-c-01..07 each
  collapse into a single post folder with ordered assets, not into 4 and 7 posts.

  A thread is ONE post. x and threads write -p2/-p3/-p4 continuation files; they
  become parts[] inside the one post rather than separate posts.

  Nothing from the build system travels: _build, __pycache__, *.py, *.pyc,
  fonts, _originals, _retired-*. Those stay in the repo where they are useful.

DRY RUN BY DEFAULT. Pass --write to actually copy.
"""

import json, re, shutil, sys
from pathlib import Path
from collections import defaultdict

SRC = Path(r"C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\CAMPAIGN-2026-07-30")
DST = Path(r"G:\My Drive\BrandGEO Social Media")
CAMPAIGN = "July-30-2026-launch-week"

# product/ is 21 listings x 2 sizes across gbp-/promo-/stripe- for all 7 plans.
# It is a reusable PRODUCT ASSET LIBRARY, not campaign content: the same files
# serve GBP listings and Stripe regardless of which campaign is running, so
# filing them under a dated campaign would date something that is not dated.
# Awaiting Constantin's ruling on where they live.
SKIP_PARTS = {"product", "_build", "__pycache__", "_originals", "_retired-2026-07-30", "fonts", "sidecars", "logo"}
SKIP_SUFFIX = {".py", ".pyc", ".ttf", ".tsv"}


def usable(p: Path) -> bool:
    if any(part in SKIP_PARTS for part in p.parts):
        return False
    if p.suffix.lower() in SKIP_SUFFIX:
        return False
    # The silent cut is the same post without audio. Variant, not a post.
    return "silent" not in p.name


def slug(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)[:60] or "post"


# key -> (channel, format, post_slug, ordinal_for_sorting_assets)
def classify(rel: Path):
    parts = rel.parts
    channel = parts[0]
    name = rel.stem

    # YouTube thumbnail belongs TO a short, it is not a post of its own.
    # thumb-20260729-2200-youtube-1280x720 -> asset 3 of short 20260729-2200.
    # Without this, nine thumbnails became nine caption-less "posts".
    m = re.match(r"^thumb-(\d{8}-\d{4})-([a-z]+)-\d+x\d+$", name)
    if m:
        return channel, "short", f"{m.group(1)}-{m.group(2)}", 3

    # bilingual city reels: berlin-de-scored / berlin-en-cover.
    # Language is part of the post identity: the DE and EN cuts are two posts,
    # aimed at two audiences, not two variants of one.
    m = re.match(r"^([a-z]+)-(de|en|es|fr|it)-(scored|cover|silent)$", name)
    if m:
        city, lang, kind = m.groups()
        return channel, "reel", f"{city}-{lang}", 0 if kind == "scored" else 1

    # GBP product listing: gbp-enterprise-1440x1440, plus -name/-category/-price
    # sidecars that are FIELDS of the listing, not captions and not posts.
    m = re.match(r"^gbp-(.+?)-\d+x\d+(?:-(name|category|price))?$", name)
    if m and channel == "product":
        return channel, "gbp-product", slug(m.group(1)), 1

    # timestamped video: 20260730-0613-instagram-scored / -cover
    m = re.match(r"^(\d{8}-\d{4})-([a-z]+)-(scored|cover|silent)$", name)
    if m:
        stamp, ch, kind = m.groups()
        fmt = {"instagram": "reel", "tiktok": "short", "youtube": "short"}.get(ch, "video")
        order = 0 if kind == "scored" else 1
        return channel, fmt, f"{stamp}-{ch}", order

    # instagram carousel: feed-01-invented-name-s3
    m = re.match(r"^feed-(\d+)-(.+?)(?:-s(\d+))?$", name)
    if m and channel == "instagram":
        idx, topic, sl = m.groups()
        return channel, "feed", f"{idx}-{slug(topic)}", int(sl or 1)

    # linkedin carousel: li-c-04-1080x1350  -> all slides are ONE post
    m = re.match(r"^li-c-(\d+)-\d+x\d+$", name)
    if m:
        return channel, "carousel", "carousel-01", int(m.group(1))

    # facebook feed: fb-feed-02-language-split-1440x1800
    m = re.match(r"^fb-feed-(\d+)-(.+?)-\d+x\d+$", name)
    if m:
        return channel, "feed", f"{m.group(1)}-{slug(m.group(2))}", 1

    # gbp: gbp-3-growth-pro-1200x900
    m = re.match(r"^gbp-(\d+)-(.+?)-\d+x\d+$", name)
    if m:
        return channel, "post", f"{m.group(1)}-{slug(m.group(2))}", 1

    # x / threads, incl. -p2 -p3 continuation parts of one thread
    m = re.match(r"^(x|threads)-(?:thread-|standalone-)?(.+?)-\d+x\d+(?:-p(\d+))?$", name)
    if m:
        _, topic, part = m.groups()
        fmt = "thread" if "thread" in name or part else "post"
        return channel, fmt, slug(topic), int(part or 1)

    return channel, rel.parts[1] if len(rel.parts) > 2 else "post", slug(name), 1


def main():
    write = "--write" in sys.argv
    if not SRC.exists():
        sys.exit(f"source missing: {SRC}")
    if not DST.exists():
        sys.exit(f"Drive not reachable: {DST}")

    groups = defaultdict(list)
    skipped = 0
    for f in SRC.rglob("*"):
        if not f.is_file():
            continue
        rel = f.relative_to(SRC)
        if not usable(rel):
            skipped += 1
            continue
        if f.suffix.lower() not in {".png", ".jpg", ".mp4", ".txt", ".md"}:
            skipped += 1
            continue
        ch, fmt, post, order = classify(rel)
        groups[(ch, fmt, post)].append((order, f))

    # A group with no image or video is notes, not a post. Do not create a folder.
    posts = {k: v for k, v in groups.items()
             if any(f.suffix.lower() in {".png", ".jpg", ".mp4"} for _, f in v)}

    root = DST / "1-Pending" / CAMPAIGN
    print(f"{'WRITING' if write else 'DRY RUN'} -> {root}\n")
    by_channel = defaultdict(int)
    total_assets = 0

    for (ch, fmt, post), items in sorted(posts.items()):
        items.sort(key=lambda t: (t[0], t[1].name))
        media = [f for _, f in items if f.suffix.lower() in {".png", ".jpg", ".mp4"}]
        texts = [f for _, f in items if f.suffix.lower() in {".txt", ".md"}]
        by_channel[ch] += 1
        total_assets += len(media)

        pdir = root / ch / fmt / post
        caption = ""
        parts = []
        fields = {}
        for t in sorted(texts, key=lambda p: p.name):
            body = t.read_text(encoding="utf-8", errors="replace").strip()
            # A GBP listing's name/category/price are structured fields. Treating
            # them as captions produced three-word "posts" with no image.
            fm = re.search(r"-(name|category|price)\.txt$", t.name)
            if fm:
                fields[fm.group(1)] = body
            elif re.search(r"-p(\d+)\.txt$", t.name):
                parts.append(body)          # thread continuation
            elif t.suffix == ".txt" and not caption:
                caption = body

        manifest = {
            "id": f"{CAMPAIGN}--{ch}--{fmt}--{post}",
            "campaign": CAMPAIGN,
            "channel": ch,
            "format": fmt,
            "status": "pending",
            "caption_file": "caption.txt",
            "thread_parts": len(parts),
            "fields": fields,
            "assets": [f"assets/{i+1:02d}{f.suffix.lower()}" for i, f in enumerate(media)],
            "source": str(media[0].relative_to(SRC)).replace("\\", "/"),
            "posted_at": None,
        }

        if write:
            (pdir / "assets").mkdir(parents=True, exist_ok=True)
            for i, f in enumerate(media):
                shutil.copy2(f, pdir / "assets" / f"{i+1:02d}{f.suffix.lower()}")
            text = caption
            if parts:
                text += "\n\n---\n\n" + "\n\n---\n\n".join(parts)
            (pdir / "caption.txt").write_text(text, encoding="utf-8")
            (pdir / "post.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        else:
            print(f"  {ch}/{fmt}/{post}: {len(media)} asset(s), "
                  f"caption {'yes' if caption else 'MISSING'}"
                  f"{f', +{len(parts)} thread parts' if parts else ''}")

    if write:
        (DST / "2-Posted").mkdir(exist_ok=True)

    print(f"\n  posts: {sum(by_channel.values())}   assets: {total_assets}   skipped: {skipped}")
    for ch, n in sorted(by_channel.items()):
        print(f"    {ch:26} {n}")
    if not write:
        print("\nDRY RUN. Nothing copied. Re-run with --write.")


if __name__ == "__main__":
    main()
