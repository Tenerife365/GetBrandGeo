#!/usr/bin/env bash
# check-links.sh — no link from the dashboard lands on a marketing 404 or vice
# versa. Covers both directions (roadmap B2): marketing -> dashboard routes,
# dashboard -> marketing pages, and internal marketing-site .html links
# (footer/support/privacy/terms), since those are what the retiring Jamie
# widget and the dashboard's mailto/support surfaces point at.
#
# Exit 0: every checked link resolves. Exit 1: at least one broken link,
# listed on stdout.
set -u
cd "$(dirname "$0")/.."

WEB_DIR="brandgeo/web"
APP_TSX="brandgeo-dashboard/src/App.tsx"
SRC_DIR="brandgeo-dashboard/src"

fail=0

# ---------------------------------------------------------------------------
# 1. marketing (brandgeo/web/**, site.js) -> dashboard routes
# ---------------------------------------------------------------------------
routes=$(grep -oE 'Route path="[^"]*"' "$APP_TSX" | sed -E 's/Route path="([^"]*)"/\1/')

# static (non-dynamic) routes, plus a manual allowance for /audit/:token
static_routes=$(echo "$routes" | grep -v ':' )

check_dashboard_path() {
  local raw="$1"
  local file="$2"
  # strip query string and fragment
  local path="${raw%%\?*}"
  path="${path%%#*}"
  # a URL at the end of an English sentence carries the full stop into the match
  path="${path%.}"

  # netlify function endpoints are not pages; not in scope for this check.
  # Tested before the trailing-slash normalisation, because site.js builds the
  # endpoints by concatenating a base URL that ends in a slash.
  case "$path" in
    /.netlify/functions*) return 0 ;;
  esac

  # normalise: strip trailing slash except root
  [ "$path" != "/" ] && path="${path%/}"
  [ -z "$path" ] && path="/"

  # dynamic route allowance
  if [[ "$path" == /audit/* ]]; then
    return 0
  fi

  if echo "$static_routes" | grep -qxF "$path"; then
    return 0
  fi

  echo "BROKEN (marketing -> dashboard): https://app.getbrandgeo.com${raw}  [in ${file}]  no matching route in App.tsx"
  return 1
}

while IFS= read -r f; do
  [ -f "$f" ] || continue
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    path="${url#https://app.getbrandgeo.com}"
    if ! check_dashboard_path "$path" "$f"; then
      fail=1
    fi
  done < <(grep -oE 'https://app\.getbrandgeo\.com[a-zA-Z0-9_./?=&%-]*' "$f" 2>/dev/null)
done < <(find "$WEB_DIR" -type f \( -name '*.html' -o -name '*.js' \))

# ---------------------------------------------------------------------------
# 2. dashboard (src/**/*.tsx) -> marketing pages (brandgeo/web/*.html etc.)
# ---------------------------------------------------------------------------
check_marketing_path() {
  local raw="$1"
  local file="$2"
  local path="${raw%%\?*}"
  path="${path%%#*}"
  path="${path#/}"
  [ -z "$path" ] && return 0   # bare domain / homepage always resolves

  case "$path" in
    images/*|*.png|*.jpg|*.svg) return 0 ;;  # asset paths, not link-check scope
  esac

  if [ -f "$WEB_DIR/$path" ]; then
    return 0
  fi

  echo "BROKEN (dashboard -> marketing): https://getbrandgeo.com/${path}  [in ${file}]  file not found in ${WEB_DIR}/"
  return 1
}

while IFS= read -r f; do
  [ -f "$f" ] || continue
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    path="${url#https://getbrandgeo.com}"
    if ! check_marketing_path "$path" "$f"; then
      fail=1
    fi
  done < <(grep -oE 'https://getbrandgeo\.com[a-zA-Z0-9_./?=&%#-]*' "$f" 2>/dev/null)
done < <(find "$SRC_DIR" -type f -name '*.tsx')

# ---------------------------------------------------------------------------
# 3. internal marketing-site links (footer, support, privacy, terms, cookies,
#    nav) across EVERY page, not just index.html
# ---------------------------------------------------------------------------
while IFS= read -r f; do
  [ -f "$f" ] || continue
  while IFS= read -r href; do
    [ -z "$href" ] && continue
    path="${href%%\?*}"
    path="${path%%#*}"
    path="${path#/}"
    [ -z "$path" ] && continue
    case "$path" in
      http*|mailto:*|tel:*) continue ;;
    esac
    if [ ! -f "$WEB_DIR/$path" ]; then
      echo "BROKEN (internal marketing link): /${path}  [in ${f}]  file not found"
      fail=1
    fi
  done < <(grep -oE 'href="/[a-zA-Z0-9_./?=&#-]*\.html[a-zA-Z0-9_./?=&#-]*"' "$f" 2>/dev/null | sed -E 's/^href="(.*)"$/\1/')
done < <(find "$WEB_DIR" -type f -name '*.html')

if [ "$fail" -ne 0 ]; then
  echo "FAIL: one or more links do not resolve, see above"
  exit 1
fi

echo "OK: every checked link (marketing->dashboard, dashboard->marketing, internal marketing) resolves"
exit 0
