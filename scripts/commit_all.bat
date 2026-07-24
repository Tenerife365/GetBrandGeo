@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add -A
git commit -m "feat: i18n all tabs, AIVisibility improvements, Netlify function for OpenAI, footer updates"
git push origin main
echo.
echo Done! Check Netlify for deploy status.
pause
