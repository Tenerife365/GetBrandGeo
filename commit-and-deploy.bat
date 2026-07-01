@echo off
echo ============================================
echo  BrandGEO - Commit, Build, Deploy + Push
echo ============================================
echo.

REM ---- Load env vars ----
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="NETLIFY_AUTH_TOKEN" set NETLIFY_AUTH_TOKEN=%%b
    if "%%a"=="NETLIFY_SITE_ID" set NETLIFY_SITE_ID=%%b
)

REM ---- 1. Remove any stale git lock ----
del /f "BpR\.git\index.lock" 2>nul
del /f ".git\index.lock" 2>nul

REM ---- 2. Commit BpR dashboard changes ----
echo [1/5] Committing BpR dashboard changes...
cd /d "C:\Users\const\Desktop\BpR"
git add brandgeo-dashboard\
git add commit-and-deploy.bat push-all.bat .gitignore
git status --short
git commit -m "Dashboard: Meta AI, Bucharest competitors, clickable bars, AI Mentions tab"
if %errorlevel% neq 0 (
    echo [BpR] Nothing new to commit, continuing...
)

REM ---- 3. Commit bpr-geo-monitor changes ----
echo.
echo [2/5] Committing bpr-geo-monitor changes...
cd /d "C:\Users\const\bpr-geo-monitor"
del /f ".git\index.lock" 2>nul
git add app\collect_llm_responses.py
git commit -m "Add Meta AI (Llama-3.3-70B) via OpenRouter to LLM_RUNNERS"
if %errorlevel% neq 0 (
    echo [monitor] Nothing new to commit, continuing...
)

REM ---- 4. Build dashboard ----
echo.
echo [3/5] Building dashboard...
cd /d "C:\Users\const\Desktop\BpR\brandgeo-dashboard"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: npm build failed.
    pause
    exit /b 1
)
echo Build OK

REM ---- 5. Create deploy zip ----
echo.
echo [4/5] Packaging and deploying to Netlify...
cd /d "C:\Users\const\Desktop\BpR\brandgeo-dashboard\dist"
echo /*    /index.html   200 > _redirects
powershell -Command "Compress-Archive -Path * -DestinationPath '%TEMP%\brandgeo-deploy.zip' -Force"

REM Deploy via Netlify API (no CLI needed)
powershell -Command ^
  "$resp = Invoke-RestMethod -Uri 'https://api.netlify.com/api/v1/sites/%NETLIFY_SITE_ID%/deploys' -Method POST -Headers @{Authorization='Bearer %NETLIFY_AUTH_TOKEN%';'Content-Type'='application/zip'} -InFile '%TEMP%\brandgeo-deploy.zip';" ^
  "Write-Host 'Deploy ID:' $resp.id;" ^
  "Write-Host 'State:' $resp.state;" ^
  "Start-Sleep 5;" ^
  "$deploy = Invoke-RestMethod -Uri ('https://api.netlify.com/api/v1/deploys/' + $resp.id) -Headers @{Authorization='Bearer %NETLIFY_AUTH_TOKEN%'};" ^
  "Invoke-RestMethod -Uri ('https://api.netlify.com/api/v1/sites/%NETLIFY_SITE_ID%/deploys/' + $resp.id + '/restore') -Method POST -Headers @{Authorization='Bearer %NETLIFY_AUTH_TOKEN%'} | Out-Null;" ^
  "Write-Host 'Published to https://app.getbrandgeo.com'"

if %errorlevel% neq 0 (
    echo ERROR: Deploy failed. Check NETLIFY_AUTH_TOKEN in .env (expires July 8 2026).
    pause
    exit /b 1
)
echo Deploy OK

REM ---- 6. Push both repos ----
echo.
echo [5/5] Pushing repos to GitHub...
cd /d "C:\Users\const\Desktop\BpR"
del /f ".git\index.lock" 2>nul
git push origin main

cd /d "C:\Users\const\bpr-geo-monitor"
del /f ".git\index.lock" 2>nul
git push origin master

echo.
echo ============================================
echo  ALL DONE - https://app.getbrandgeo.com
echo ============================================
pause
