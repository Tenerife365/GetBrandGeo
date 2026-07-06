@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add src/pages/AIVisibility.tsx
git commit -m "fix: wrap admin buttons in fragment to fix JSX parent element error"
git push
