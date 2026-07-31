@echo off
echo ============================================
echo  BrandGEO - Commit + Push (auto-deploys)
echo ============================================
echo.

REM ---- Commit message ----
set /p MSG=Commit message:
if "%MSG%"=="" set MSG=Update dashboard

REM ---- 1. Remove any stale git lock ----
del /f ".git\index.lock" 2>nul

REM ---- 2. Commit BpR repo ----
echo.
echo [1/3] Committing BpR changes...
cd /d "C:\Users\const\Desktop\BpR"
git add -A
git status --short
git commit -m "%MSG%"
if %errorlevel% neq 0 (
    echo [BpR] Nothing new to commit, continuing...
)

REM ---- 3. Commit bpr-geo-monitor (only if there are changes) ----
echo.
echo [2/3] Committing bpr-geo-monitor changes...
cd /d "C:\Users\const\bpr-geo-monitor"
del /f ".git\index.lock" 2>nul
git add -A
git diff --cached --quiet
if %errorlevel% neq 0 (
    git commit -m "%MSG%"
    echo [monitor] Committed OK
) else (
    echo [monitor] Nothing to commit, skipping...
)

REM ---- 4. Push both repos ----
echo.
echo [3/3] Pushing to GitHub...
cd /d "C:\Users\const\Desktop\BpR"
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: BpR push failed
    pause
    exit /b 1
)
echo BpR pushed - Netlify will auto-deploy in ~30s

cd /d "C:\Users\const\bpr-geo-monitor"
git push origin master
if %errorlevel% neq 0 (
    echo ERROR: bpr-geo-monitor push failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo  DONE - https://app.getbrandgeo.com
echo  (check Netlify for build status)
echo ============================================
pause
