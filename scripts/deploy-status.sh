#!/bin/sh
# ============================================================================
# deploy-status.sh  --  answers "if I push right now, does it cost a build?"
#
# Read-only. Runs no git command that changes anything, so it is safe from any
# session at any time, including while another session is working.
#
#   sh scripts/deploy-status.sh
# ============================================================================

cd "$(dirname "$0")/.." || exit 1

echo "Fetching (read-only)..."
git fetch -q origin 2>/dev/null

ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null)
behind=$(git rev-list --count HEAD..origin/main 2>/dev/null)

echo ""
echo "  local HEAD is $ahead commit(s) ahead of origin/main, $behind behind"

if [ "$behind" -gt 0 ]; then
  echo "  -> rebase before committing:  git pull --rebase"
fi

if [ "$ahead" -eq 0 ]; then
  echo ""
  echo "  Nothing to push. No build pending."
  exit 0
fi

# THREE dots. Two-dot also lists files where origin/main moved ahead and the
# branch did not, which once made a content-only branch look like it touched
# 118 dashboard files. That error costs a build you did not need to spend.
files=$(git diff --name-only origin/main...HEAD)
dash=$(printf '%s\n' "$files" | grep '^brandgeo-dashboard/')
n=$(printf '%s\n' "$dash" | grep -c .)

echo ""
echo "  commits waiting:"
git log --oneline origin/main..HEAD | sed 's/^/    /'

echo ""
if [ "$n" -eq 0 ]; then
  echo "  COST: FREE. No brandgeo-dashboard/ files."
  echo "        Marketing goes to cPanel by webhook; docs go nowhere."
  echo "        Push whenever:  git push"
else
  echo "  COST: ONE NETLIFY BUILD. $n dashboard file(s):"
  printf '%s\n' "$dash" | sed 's/^/    /'
  echo ""
  echo "  The pre-push hook will block this. When you mean it:"
  echo "        BATCH_PUSH=1 git push"
fi
echo ""
