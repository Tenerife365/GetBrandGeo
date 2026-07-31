@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add src/pages/Prompts.tsx
git commit -m "fix: add timeout + surface function errors in Prompt Discovery"
git push origin main
pause
