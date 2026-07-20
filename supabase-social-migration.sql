-- ============================================================================
-- supabase-social-migration.sql  --  "AI Social" feature (multi-platform
-- social publishing & scheduling for BrandGEO)
--
-- PROBLEM / PURPOSE
--   Adds the tables that back the AI Social feature: compose a post once,
--   adapt it per platform, schedule it, and publish to Instagram / Facebook /
--   LinkedIn / Google Business Profile / X via a swappable publishing layer
--   (Ayrshare for the MVP). Internal-first, but multi-tenant from day one:
--   every table carries client_id and mirrors the project's standard RLS
--   pattern (is_admin() OR client_id = get_my_client_id()).
--
-- APPLIED TO LIVE PROJECT (duiyifepitvugyulobqm)?  NOT YET.
--   Run this whole file once in the Supabase SQL editor. It is safe to re-run
--   (create ... if not exists / drop policy if exists throughout).
--
-- DEPENDS ON
--   public.clients(id serial)  and the helper fns from
--   supabase-multitenant-migration.sql:  public.is_admin(),
--   public.get_my_client_id().  Those already exist in the live project.
--
-- VERIFICATION (run after applying):
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where tablename in
--     ('social_profiles','social_accounts','social_posts','social_post_targets')
--   order by tablename, cmd;
--   -- Expect: RLS enabled on all 4, every policy scoped to {authenticated},
--   -- and NO policy with a bare qual=true.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- generic updated_at trigger (security definer, pinned search_path) so posts
-- track their own edit time without the app having to set it.
-- ---------------------------------------------------------------------------
create or replace function public.social_set_updated_at()
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
-- 1. social_profiles  --  one row per workspace (client). Maps a client to its
--    Ayrshare profile key and stores the brand voice used for AI generation.
--    profile_key NULL = the single default profile (Ayrshare Premium plan);
--    on the Business plan each workspace gets its own profile key.
-- ---------------------------------------------------------------------------
create table if not exists public.social_profiles (
  client_id           integer primary key references public.clients(id) on delete cascade,
  provider            text        not null default 'ayrshare',
  profile_key         text,                                  -- null = default/Premium profile
  ref_id              text,                                  -- Ayrshare profile refId (Business)
  brand_voice         jsonb       not null default '{}'::jsonb, -- {tone, audience, hashtags, cta, ...}
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.social_profiles enable row level security;

drop policy if exists social_profiles_select on public.social_profiles;
create policy social_profiles_select on public.social_profiles
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_profiles_insert on public.social_profiles;
create policy social_profiles_insert on public.social_profiles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists social_profiles_update on public.social_profiles;
create policy social_profiles_update on public.social_profiles
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop trigger if exists trg_social_profiles_updated_at on public.social_profiles;
create trigger trg_social_profiles_updated_at
  before update on public.social_profiles
  for each row execute function public.social_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. social_accounts  --  cache of the platform accounts connected for a
--    workspace (source of truth is the provider; this is for fast display).
-- ---------------------------------------------------------------------------
create table if not exists public.social_accounts (
  id            bigserial primary key,
  client_id     integer   not null references public.clients(id) on delete cascade,
  platform      text      not null check (platform in ('instagram','facebook','linkedin','gbp','x')),
  external_id   text,                                        -- provider/platform account id
  display_name  text,
  status        text      not null default 'connected' check (status in ('connected','disconnected','error')),
  meta          jsonb     not null default '{}'::jsonb,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, platform, external_id)
);

create index if not exists idx_social_accounts_client on public.social_accounts(client_id);

alter table public.social_accounts enable row level security;

drop policy if exists social_accounts_select on public.social_accounts;
create policy social_accounts_select on public.social_accounts
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_accounts_insert on public.social_accounts;
create policy social_accounts_insert on public.social_accounts
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists social_accounts_update on public.social_accounts;
create policy social_accounts_update on public.social_accounts
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_accounts_delete on public.social_accounts;
create policy social_accounts_delete on public.social_accounts
  for delete to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop trigger if exists trg_social_accounts_updated_at on public.social_accounts;
create trigger trg_social_accounts_updated_at
  before update on public.social_accounts
  for each row execute function public.social_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. social_posts  --  the composed post (one per compose action). The base
--    text/media are the shared version; per-platform adaptations live in
--    social_post_targets.
-- ---------------------------------------------------------------------------
create table if not exists public.social_posts (
  id                bigserial primary key,
  client_id         integer   not null references public.clients(id) on delete cascade,
  created_by        uuid,                                     -- auth.users.id
  status            text      not null default 'draft'
                      check (status in ('draft','scheduled','publishing','published','failed','partial','canceled')),
  source            text      not null default 'manual' check (source in ('manual','ai')),
  brief             text,                                     -- the AI brief, if source='ai'
  base_text         text,
  base_media        jsonb     not null default '[]'::jsonb,   -- [{url, type, alt?}]
  scheduled_at      timestamptz,                              -- null = publish now / draft
  provider          text      not null default 'ayrshare',
  provider_post_id  text,                                     -- provider's top-level id for this post
  error             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_social_posts_client        on public.social_posts(client_id);
create index if not exists idx_social_posts_client_sched  on public.social_posts(client_id, scheduled_at);
create index if not exists idx_social_posts_status        on public.social_posts(status);

alter table public.social_posts enable row level security;

drop policy if exists social_posts_select on public.social_posts;
create policy social_posts_select on public.social_posts
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

-- Self-serve users compose their own posts, so INSERT/UPDATE/DELETE are allowed
-- for the owning tenant (mirrors the prompts_own_client_writes decision). Real
-- publishing writes still go through the service key, which bypasses RLS.
drop policy if exists social_posts_insert on public.social_posts;
create policy social_posts_insert on public.social_posts
  for insert to authenticated
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_posts_update on public.social_posts;
create policy social_posts_update on public.social_posts
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_posts_delete on public.social_posts;
create policy social_posts_delete on public.social_posts
  for delete to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop trigger if exists trg_social_posts_updated_at on public.social_posts;
create trigger trg_social_posts_updated_at
  before update on public.social_posts
  for each row execute function public.social_set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. social_post_targets  --  one row per (post, platform). Holds the
--    per-platform text/media override and the publish result. client_id is
--    denormalised for RLS + fast filtering (same pattern as ai_results).
-- ---------------------------------------------------------------------------
create table if not exists public.social_post_targets (
  id              bigserial primary key,
  post_id         bigint    not null references public.social_posts(id) on delete cascade,
  client_id       integer   not null references public.clients(id) on delete cascade,
  platform        text      not null check (platform in ('instagram','facebook','linkedin','gbp','x')),
  text_override   text,                                       -- null = use post.base_text
  media_override  jsonb,                                      -- null = use post.base_media
  status          text      not null default 'pending'
                    check (status in ('pending','scheduled','published','failed','skipped')),
  provider_ref    text,                                       -- provider's per-platform post id
  permalink       text,                                       -- live post URL once published
  error           text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (post_id, platform)
);

create index if not exists idx_social_targets_post   on public.social_post_targets(post_id);
create index if not exists idx_social_targets_client on public.social_post_targets(client_id);

alter table public.social_post_targets enable row level security;

drop policy if exists social_targets_select on public.social_post_targets;
create policy social_targets_select on public.social_post_targets
  for select to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_targets_insert on public.social_post_targets;
create policy social_targets_insert on public.social_post_targets
  for insert to authenticated
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_targets_update on public.social_post_targets;
create policy social_targets_update on public.social_post_targets
  for update to authenticated
  using      (public.is_admin() or client_id = public.get_my_client_id())
  with check (public.is_admin() or client_id = public.get_my_client_id());

drop policy if exists social_targets_delete on public.social_post_targets;
create policy social_targets_delete on public.social_post_targets
  for delete to authenticated
  using (public.is_admin() or client_id = public.get_my_client_id());

drop trigger if exists trg_social_targets_updated_at on public.social_post_targets;
create trigger trg_social_targets_updated_at
  before update on public.social_post_targets
  for each row execute function public.social_set_updated_at();

-- ============================================================================
-- End of AI Social migration.
-- ============================================================================
