#!/usr/bin/env python3
"""
pingomatic_ping.py — Ping Pingomatic after publishing a new BrandGEO
article or news post.

Pingomatic (pingomatic.com) is a free, standard XML-RPC update-ping
service — the same mechanism WordPress uses automatically every time you
hit Publish. One ping to Pingomatic fans out to ~10 well-known
update-tracking services on your behalf. This is normal, legitimate blog
syndication practice, not an SEO/link-manipulation tactic — see
rules/content-integrity.md for the standing project rule this follows.

Run this AFTER you've uploaded a new article/news post to cPanel and
confirmed it's actually live (per the brandgeo_verify_cpanel_upload
convention — don't ping a URL that isn't live yet).

Requires nothing beyond the Python 3 standard library (xmlrpc.client) —
no pip install needed.

USAGE
-----
    python pingomatic_ping.py "<Title>" "<Full Live URL>"

EXAMPLES
--------
    python pingomatic_ping.py "GEO vs SEO: The Fundamental Difference" "https://getbrandgeo.com/bg-005.html"

    python pingomatic_ping.py "BrandGEO Launches High-Frequency Real-Time AI Visibility Monitoring Engine" "https://getbrandgeo.com/news/real-time-ai-visibility-engine-launch/"

Optional flags:
    --name "Custom Site Name"   Override the site name reported to
                                 Pingomatic (default: "BrandGEO")
    --dry-run                   Print exactly what would be sent, but
                                 don't actually contact Pingomatic.
"""

import sys
import argparse
import xmlrpc.client

PINGOMATIC_URL = "http://rpc.pingomatic.com/"
DEFAULT_SITE_NAME = "BrandGEO"


def ping(title: str, url: str, site_name: str = DEFAULT_SITE_NAME, dry_run: bool = False) -> bool:
    """
    Sends a weblogUpdates.ping(name, url) XML-RPC call to Pingomatic.
    Returns True on success, False on failure. Never raises — callers
    get a clean boolean plus printed diagnostics either way.
    """
    print(f"Article:  {title}")
    print(f"URL:      {url}")
    print(f"Site name reported to Pingomatic: {site_name}")

    if dry_run:
        print("\n[DRY RUN] Would call: rpc.pingomatic.com -> weblogUpdates.ping(")
        print(f"    {site_name!r},")
        print(f"    {url!r}")
        print(")")
        print("No network call made.")
        return True

    server = xmlrpc.client.ServerProxy(PINGOMATIC_URL)
    try:
        result = server.weblogUpdates.ping(site_name, url)
    except Exception as e:
        print(f"\nFAILED to reach Pingomatic: {e}")
        return False

    flerror = result.get("flerror")
    message = result.get("message", "")

    if flerror:
        print(f"\nPingomatic reported an error: {message}")
        return False

    print(f"\nPinged Pingomatic successfully.")
    print(f"Pingomatic response: {message}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Ping Pingomatic after publishing a new BrandGEO article or news post.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("title", help="Title of the article/post that was just published")
    parser.add_argument("url", help="Full live URL of the article/post (e.g. https://getbrandgeo.com/bg-005.html)")
    parser.add_argument("--name", default=DEFAULT_SITE_NAME, help=f"Site name to report to Pingomatic (default: {DEFAULT_SITE_NAME})")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be sent without contacting Pingomatic")
    args = parser.parse_args()

    if not args.dry_run and not args.url.startswith("https://getbrandgeo.com"):
        print(f"WARNING: URL doesn't start with https://getbrandgeo.com — double-check this is correct before pinging a third-party service about it.")
        try:
            confirm = input("Continue anyway? [y/N] ")
        except EOFError:
            confirm = "n"
        if confirm.strip().lower() != "y":
            print("Aborted — no ping sent.")
            sys.exit(0)

    ok = ping(args.title, args.url, args.name, args.dry_run)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
