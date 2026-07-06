@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add src/lib/marketContext.tsx
git add src/components/Layout.tsx
git add src/lib/collectionContext.tsx
git add netlify/functions/collect-prompt.js
git add src/pages/AIVisibility.tsx
git commit -m "feat: multi-select markets with explicit geo context for LLM collection

- marketContext.tsx: replaced single {market,region} with selections[]
  - addSelection / removeSelection / updateRegion API
  - primaryMarket/primaryRegion for backwards compat
  - Persists as brandgeo_markets_v2 JSON in localStorage
  - Migrates old single-market storage automatically
  - 24 markets across Europe, Americas, APAC, Middle East

- Layout.tsx: replaced two dropdown pickers with chip-based multi-select
  - Each selected market shows as a card with inline region <select>
  - X button removes a market (min 1 always kept)
  - '+ Add market' button opens picker of unselected markets
  - Clean up: removed showRegions state, removed MapPin import

- collectionContext.tsx: runCollection now accepts markets?: MarketSelection[]
  - Passes market_label and region_label in POST body
  - Logs selected markets in browser console for debug

- collect-prompt.js: buildSystemContext now uses explicit market_label/region_label
  - Priority: explicit params > TLD fallback (never wrong again)
  - ctx_geo in response shows exactly what location was used
  - TLD fallback kept for backwards compat only

- AIVisibility.tsx: passes selections to startCollection
  - Market badges in header show all selected markets with region
  - runCollection and forceCollection both forward selections
"
git push origin main
echo.
echo Done. Check Netlify deploy status.
pause
