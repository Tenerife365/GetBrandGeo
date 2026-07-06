@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add netlify/functions/collect-prompt.js
git commit -m "fix: switch ChatGPT to Responses API with forced web_search_preview tool

gpt-4o-search-preview in Chat Completions decides when to search.
Responses API (/v1/responses) with web_search_preview tool always searches.
This matches what ChatGPT.com does for every user query."
git push
