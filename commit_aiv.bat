@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add src/pages/AIVisibility.tsx src/lib/i18nContext.tsx
git commit -m "feat: improve AIVisibility tab — reload spinner, BpR categories, dynamic filters"
git push origin main
pause
