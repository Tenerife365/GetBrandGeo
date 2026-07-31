-- ============================================================================
-- supabase-social-media-bucket.sql  --  public Storage bucket for AI Social
-- generated cover images (social-image.js).
--
-- The Netlify function uploads each rendered PNG with the SERVICE KEY (bypasses
-- RLS), and the bucket is PUBLIC so Ayrshare and the social networks can fetch
-- the image by its public URL when publishing. No extra storage.objects policies
-- are needed: writes are service-role only, reads are public via the bucket flag.
--
-- APPLIED TO LIVE PROJECT (duiyifepitvugyulobqm)?  NOT YET.
--
-- You can do this in the Supabase DASHBOARD instead (simplest):
--   Storage -> New bucket -> name it exactly  social-media  -> toggle "Public
--   bucket" ON -> Save.
--
-- Or run this once in the SQL editor:
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('social-media', 'social-media', true)
on conflict (id) do update set public = true;
