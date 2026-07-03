@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add netlify/functions/suggest-prompts.js netlify.toml src/pages/Prompts.tsx
git commit -m "fix: route AI Prompt Discovery through Netlify function (keep OpenAI key server-side)"
git push origin main
pause
