-- ============================================================================
-- supabase-client-api-keys-migration-2026-09-22.sql
-- Remote MCP access keys (docs/arch/mcp-access.md sections 3 and 9).
--
-- APPLIED BY CONSTANTIN in the Supabase SQL Editor, never by an agent.
-- Idempotent: safe to run twice.
-- ORDER: apply this BEFORE deploying mcp-server.js / client-api-keys.js.
-- mcp-server.js reads client_api_keys on the first authenticated call; a
-- deploy before the table exists answers 500 to every customer key
-- (client-api-keys.js answers 503 "not available yet" as a safety net).
--
-- The key itself is never stored: key_hash is sha256 hex, key_prefix is
-- display only. No rate-limit table: mcp-server.js reuses
-- affiliate_rate_check() / affiliate_rate_limits with an `mcp:` key namespace.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_api_keys (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     integer     NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  key_hash      text        NOT NULL UNIQUE,
  key_prefix    text        NOT NULL,
  label         text        NOT NULL DEFAULT '' CHECK (char_length(label) <= 60),
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

COMMENT ON TABLE public.client_api_keys IS
  'Per-client MCP API keys (docs/arch/mcp-access.md). key_hash = sha256 hex of the key; the key itself is never stored. Revoke sets revoked_at; rows are never deleted by the product.';

CREATE INDEX IF NOT EXISTS idx_client_api_keys_client_active
  ON public.client_api_keys (client_id) WHERE revoked_at IS NULL;

ALTER TABLE public.client_api_keys ENABLE ROW LEVEL SECURITY;

-- Read your own client's keys; admins read all. No INSERT, UPDATE or DELETE
-- policy for authenticated: writes go through the service role in
-- client-api-keys.js and mcp-server.js. No DELETE policy at all: revoke sets
-- revoked_at.
DROP POLICY IF EXISTS client_api_keys_select ON public.client_api_keys;
CREATE POLICY client_api_keys_select ON public.client_api_keys
  FOR SELECT TO authenticated
  USING (public.is_admin() OR client_id = public.get_my_client_id());

-- RLS cannot hide a column, so key_hash is withheld by privilege.
-- Table-level privileges are revoked first (Supabase grants ALL on new public
-- tables to anon and authenticated by default), then SELECT is granted back on
-- the named columns only. anon gets nothing. service_role is untouched.
REVOKE ALL ON public.client_api_keys FROM anon, authenticated;
GRANT SELECT (id, client_id, key_prefix, label, created_by, created_at, last_used_at, revoked_at)
  ON public.client_api_keys TO authenticated;

-- ── Rollback (run by hand only if the feature is withdrawn) ─────────────────
-- Destroys every issued key; every MCP client stops authenticating.
--   DROP TABLE IF EXISTS public.client_api_keys;
-- The shared rate counters need no rollback; `mcp:` rows age out of
-- affiliate_rate_limits with the existing one-day prune.
