# =============================================================================
# deploy-status.ps1  --  answers "if I push right now, does it cost a build?"
#
# PowerShell twin of deploy-status.sh. It exists because `sh` is not a command
# in PowerShell and this machine's default shell is PowerShell, so the .sh file
# was unrunnable where it was actually needed. Both are kept: the .sh one runs
# inside git hooks and in git-bash, this one runs where Constantin types.
#
# Read-only. Nothing here changes a ref, a file, or the index, so it is safe to
# run from any session at any time, including while another session works.
#
#   .\scripts\deploy-status.ps1
#
# Written for Windows PowerShell 5.1: no ternary, no `&&`, no null-coalescing.
# =============================================================================

Set-Location (Join-Path $PSScriptRoot '..')

Write-Host "Fetching (read-only)..."
git fetch -q origin

$ahead  = [int](git rev-list --count origin/main..HEAD)
$behind = [int](git rev-list --count HEAD..origin/main)

Write-Host ""
Write-Host "  local HEAD is $ahead commit(s) ahead of origin/main, $behind behind"

if ($behind -gt 0) {
  Write-Host "  -> rebase before committing:  git pull --rebase" -ForegroundColor Yellow
}

if ($ahead -eq 0) {
  Write-Host ""
  Write-Host "  Nothing to push. No build pending." -ForegroundColor Green
  Write-Host ""
  exit 0
}

# THREE dots. The two-dot form also lists files where origin/main moved ahead
# and the branch did not, which once made a content-only branch look like it
# touched 118 dashboard files. Being wrong in that direction spends a build you
# did not owe; being wrong the other way hides one you do.
$files = git diff --name-only origin/main...HEAD
$dash  = @($files | Where-Object { $_ -like 'brandgeo-dashboard/*' })

Write-Host ""
Write-Host "  commits waiting:"
git log --oneline origin/main..HEAD | ForEach-Object { Write-Host "    $_" }

Write-Host ""
if ($dash.Count -eq 0) {
  Write-Host "  COST: FREE. No brandgeo-dashboard/ files." -ForegroundColor Green
  Write-Host "        Marketing goes to cPanel by webhook; docs go nowhere."
  Write-Host "        Push whenever:  git push"
} else {
  Write-Host "  COST: ONE NETLIFY BUILD. $($dash.Count) dashboard file(s):" -ForegroundColor Yellow
  $dash | ForEach-Object { Write-Host "    $_" }
  Write-Host ""
  Write-Host "  The pre-push hook will block this. When you mean it:"
  Write-Host '        $env:BATCH_PUSH=1; git push'
}
Write-Host ""
