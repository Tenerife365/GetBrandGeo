-- ============================================================================
-- supabase-seo-pages-migration.sql  --  "AI SEO" Phase 2 (Site audit)
--
-- PROBLEM / PURPOSE
--   Phase 2 crawls a client's existing pages and scores each on how quotable it
--   is for AI answer engines (GEO), with specific edits to make. This adds the
--   two tables that back it:
--     * seo_pages  -- crawled-page cache + per-page GEO audit
--     * seo_crawls -- one row per crawl run (status/progress for the UI to poll)
--
--   The crawler itself is free (sitemap.xml + server-side fetch) behind a
--   swappable provider so Firecrawl can be added later; see _seo_crawl.js.
--
-- APPLIED TO LIVE PROJECT (duiyifepitvugyulobqm)?  NOT YET.
--   Run once in the SQL editor. Safe to re-run.
--
-- DEPENDS ON: public.clients(id), public.is_admin(), public.get_my_client_id(),
--   and public.seo_set_updated_at() (created by supabase-seo-briefs-migration.sql
--   -- apply that first; this re-creates it defensively if missing).
--
-- VERIFICATION:
--   select tablename, policyname, cmd, roles from pg_policies
--   where tablename in ('seo_pages','seo_crawls') order by tablename, cmd;
-- ============================================================================

create or replace function public.seo_set_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

-- ---------------------------------------------------------------------------
-- seo_pages  --  one row per crawled URL for a client. content_md is the
-- extracted text/markdown; geo_score + audit are filled by seo-audit-page.js.
-- ---------------------------------------------------------------------------
create table if not exists public.seo_pages (
  id          bigserial primary key,
  client_id   integer     not null references public.clients(id) on delete cascade,
  url         text        not null,
  title       text,
  content_md  text,
  geo_score   integer,                                    -- null until audited
  audit       jsonb,                                      -- {summary, issues:[{severity,text}], suggestions:[text]}
  status      text        not null default 'crawled'
                check (status in ('crawled','audited','stale')),
  fetched_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (client_id, url)
);

create index if not exists idx_seo_pages_client        on public.seo_pages(client_id);
create index if not exists idx_seo_pages_client_status on public.seo_pages(client_id, status);

alter table public.seo_pages enable row level security;

drop policy if exists seo_pages_select on public.seo_pages;
create policy seo_pages_select on public.seo_pages
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_pages_insert on public.seo_pages;
create policy seo_pages_insert on public.seo_pages
  for insert to authenticated
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_pages_update on public.seo_pages;
create policy seo_pages_update on public.seo_pages
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_pages_delete on public.seo_pages;
create policy seo_pages_delete on public.seo_pages
  for delete to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop trigger if exists trg_seo_pages_updated_at on public.seo_pages;
create trigger trg_seo_pages_updated_at
  before update on public.seo_pages
  for each row execute function public.seo_set_updated_at();

-- ---------------------------------------------------------------------------
-- seo_crawls  --  one row per crawl run. The UI creates it (via seo-crawl.js),
-- the background worker updates it, and the frontend polls it for progress.
-- ---------------------------------------------------------------------------
create table if not exists public.seo_crawls (
  id          bigserial primary key,
  client_id   integer     not null references public.clients(id) on delete cascade,
  status      text        not null default 'running'
                check (status in ('running','done','error')),
  pages       integer     not null default 0,
  error       text,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_seo_crawls_client on public.seo_crawls(client_id, created_at desc);

alter table public.seo_crawls enable row level security;

drop policy if exists seo_crawls_select on public.seo_crawls;
create policy seo_crawls_select on public.seo_crawls
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_crawls_insert on public.seo_crawls;
create policy seo_crawls_insert on public.seo_crawls
  for insert to authenticated
  with check (public.is_admin() or client_id = public.get_my_client_id());

-- ============================================================================
-- End of AI SEO Phase 2 (Site audit) migration.
-- ============================================================================
