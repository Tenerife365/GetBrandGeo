-- ============================================================================
-- supabase-seo-briefs-migration.sql  --  "AI SEO" Phase 1 (Opportunities)
--
-- PROBLEM / PURPOSE
--   AI SEO is the content-action layer of the product loop
--   (AI Visibility measures -> AI SEO acts on content -> AI Social distributes).
--   Phase 1 ships the new-content half: turn a client's AI-visibility gaps,
--   open recommendations, and competitor pressure into concrete content briefs,
--   each of which can be expanded into a full GEO-scored draft on demand.
--
--   This migration adds the ONE table Phase 1 needs: seo_briefs. The crawler /
--   per-page audit tables (seo_pages, seo_consistency, seo_crawls) land with
--   Phase 2/3 (AI-SEO-SPEC.md), so they are deliberately NOT created here.
--
-- APPLIED TO LIVE PROJECT (duiyifepitvugyulobqm)?  NOT YET.
--   Run this whole file once in the Supabase SQL editor. Safe to re-run
--   (create ... if not exists / drop policy if exists throughout).
--
-- DEPENDS ON
--   public.clients(id serial) and the helper fns from
--   supabase-multitenant-migration.sql:  public.is_admin(),
--   public.get_my_client_id().  Those already exist in the live project.
--
-- VERIFICATION (run after applying):
--   select tablename, policyname, cmd, roles
--   from pg_policies where tablename = 'seo_briefs' order by cmd;
--   -- Expect: RLS enabled, every policy scoped to {authenticated},
--   -- and NO policy with a bare qual=true.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- updated_at trigger (security definer, pinned search_path) so a brief tracks
-- its own edit time without the app having to set it. Mirrors
-- social_set_updated_at() from supabase-social-migration.sql.
-- ---------------------------------------------------------------------------
create or replace function public.seo_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- seo_briefs  --  new-content opportunities derived from a client's GEO data.
--
--   source        which signal produced this brief.
--   source_ref    stable per-signal key so re-running seo-opportunities UPDATES
--                 the same brief instead of piling up duplicates
--                 (gap:<prompt_id>, rec:<slug>, competitors, manual:<n>).
--                 The unique (client_id, source, source_ref) makes the
--                 deterministic generator idempotent, and lets an UPSERT refresh
--                 the deterministic fields WITHOUT clobbering status/draft_text/
--                 geo_score (those columns are simply left out of the upsert
--                 payload, so a dismissed or already-drafted brief keeps its
--                 state across regenerations).
--   status        idea -> drafting -> drafted -> published, or dismissed.
--   draft_text /  filled in by seo-draft.js (the "Draft it" step).
--     geo_score
--   context       grounding string handed to seo-draft.js and, via the AI Social
--                 bridge, to social-generate.js (same shape social-boost uses).
-- ---------------------------------------------------------------------------
create table if not exists public.seo_briefs (
  id              bigserial primary key,
  client_id       integer     not null references public.clients(id) on delete cascade,
  source          text        not null
                    check (source in ('visibility_gap','recommendation','competitor','manual')),
  source_ref      text        not null default 'manual',
  title           text        not null,
  target_prompt   text,
  outline         jsonb       not null default '[]'::jsonb,   -- ["Section heading", ...]
  guidance        text,
  target_entities jsonb       not null default '{}'::jsonb,   -- {brand, competitors:[...]}
  status          text        not null default 'idea'
                    check (status in ('idea','drafting','drafted','published','dismissed')),
  draft_text      text,
  geo_score       jsonb,                                       -- {seo, geo, verdict, notes}
  context         text,
  drafted_at      timestamptz,                                 -- when a draft was last generated (monthly cap)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, source, source_ref)
);

create index if not exists idx_seo_briefs_client        on public.seo_briefs(client_id);
create index if not exists idx_seo_briefs_client_status on public.seo_briefs(client_id, status);

alter table public.seo_briefs enable row level security;

-- Standard project RLS: admins act on any client, a viewer only on their own.
-- Self-serve owners can dismiss / re-status their own briefs directly from the
-- UI (same precedent as social_posts / prompts_own_client_writes); the heavy
-- writes (generate, draft) go through the service key, which bypasses RLS.
drop policy if exists seo_briefs_select on public.seo_briefs;
create policy seo_briefs_select on public.seo_briefs
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_briefs_insert on public.seo_briefs;
create policy seo_briefs_insert on public.seo_briefs
  for insert to authenticated
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_briefs_update on public.seo_briefs;
create policy seo_briefs_update on public.seo_briefs
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists seo_briefs_delete on public.seo_briefs;
create policy seo_briefs_delete on public.seo_briefs
  for delete to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop trigger if exists trg_seo_briefs_updated_at on public.seo_briefs;
create trigger trg_seo_briefs_updated_at
  before update on public.seo_briefs
  for each row execute function public.seo_set_updated_at();

-- ============================================================================
-- End of AI SEO Phase 1 (Opportunities) migration.
-- ============================================================================
