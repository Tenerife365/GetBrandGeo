@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add netlify/functions/collect-prompt.js src/lib/collectionContext.tsx src/pages/AIVisibility.tsx
git commit -m "feat: smart collection + Force Refresh button

Run Collection (smart):
- Only runs LLMs with no result this month
- Retries failed/missing engines without touching successful ones

Force Refresh button (orange, with rotate icon):
- Wipes all results for every prompt, re-runs all 5 engines from scratch
- Use when you want completely fresh data or after a code change

collect-prompt.js: force flag controls delete-all vs skip-existing logic"
git push
