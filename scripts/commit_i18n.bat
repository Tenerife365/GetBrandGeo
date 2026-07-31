@echo off
cd /d C:\Users\const\Desktop\BpR

echo Removing stale git lock...
del /f /q .git\index.lock 2>nul

cd brandgeo-dashboard

echo Adding changed files...
git add src/lib/i18nContext.tsx src/pages/AIVisibility.tsx src/pages/Dashboard.tsx src/pages/Mentions.tsx src/pages/Competitors.tsx src/pages/Prompts.tsx src/pages/Recommendations.tsx

echo Committing...
git commit -m "feat: full dashboard i18n — all 6 tabs clean, TS 0 errors"

echo Pushing to GitHub...
git push origin main

echo Done! Netlify will deploy automatically.
pause
