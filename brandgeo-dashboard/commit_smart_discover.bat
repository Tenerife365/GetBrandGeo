@echo off
cd /d C:\Users\const\Desktop\BpR\brandgeo-dashboard
git add src/pages/Prompts.tsx
git commit -m "feat: smart AI Discover — auto-generates prompts from client website

- AI Discover now auto-fetches client name + brand_website on open
- Immediately triggers prompt generation (no manual description needed)
- buildSystemPrompt() is dynamic and business-agnostic (any industry/language)
- 4 universal categories: general, local, comparison, use_case
- Category filter chips are now dynamic — derived from actual prompts in DB
  (shows only categories that exist, works for any client automatically)
- CATEGORY_META kept as display/color map with legacy BpR + BrandGEO compat
- User can still type follow-up messages to refine or add more prompts"
git push
