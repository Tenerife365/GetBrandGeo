# BrandGEO Dashboard — Setup Guide

## 1. Run locally (demo mode — no Supabase needed)

```bash
cd brandgeo-dashboard
npm install
npm run dev
# Open http://localhost:5173 — login with any email/password
```

---

## 2. Connect real data (Supabase)

### Create Supabase project
1. Go to https://supabase.com → New Project
2. Name it `brandgeo`, choose the closest region
3. Copy your **Project URL** and **anon public key** from Settings → API

### Run the schema
1. In Supabase → SQL Editor, paste the contents of `supabase-schema.sql` and run

### Create your login user
1. Supabase → Authentication → Users → Invite User
2. Enter your email (e.g. `constantin@workfully.com`)
3. You'll get a magic-link email to set your password

### Set environment variables
```bash
cp .env.example .env
# Edit .env:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Migrate existing data
Export your Google Sheets as CSV, then import via Supabase → Table Editor → Import CSV
(map columns to `search_results` and `page_analysis` tables).

Or update `bpr-geo-monitor` to write directly to Supabase instead of local PostgreSQL
(change `DATABASE_URL` in `.env` to your Supabase connection string from Settings → Database).

---

## 3. Deploy to app.getbrandgeo.com

### Option A: Netlify (recommended — free)
1. Push this folder to a GitHub repo (private)
2. netlify.com → New site → Import from GitHub
3. Build command: `npm run build`  |  Publish dir: `dist`
4. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Site Settings → Domain Management → Add custom domain: `app.getbrandgeo.com`
6. In your DNS (cPanel or registrar): add CNAME `app` → `your-site.netlify.app`

### Option B: Vercel
Same as Netlify — vercel.com → New Project → import repo → same env vars → Settings → Domains → `app.getbrandgeo.com`

---

## 4. Connect bpr-geo-monitor to Supabase (future)

In `bpr-geo-monitor/.env`, replace local PostgreSQL with Supabase's connection string:
```
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-db-password
```
Get the connection string from Supabase → Settings → Database → Connection string → URI.

---

## Pages

| Route | What it shows |
|---|---|
| `/login` | Email + password login |
| `/` | Overview: KPIs, score breakdown, competitor bar, top pages |
| `/mentions` | All analyzed pages with filters + AI summaries |
| `/competitors` | Competitor comparison with radar chart + table |

Export PDF button on the Overview page generates a branded A4 report.
