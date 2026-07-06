@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add netlify/functions/collect-prompt.js
git commit -m "fix: upgrade Claude collection model from Haiku to Sonnet

claude-haiku-4-5 has weak recall of niche/local businesses.
claude-sonnet-4-5 is what real Claude.ai users experience and has
significantly broader training data coverage."
git push
