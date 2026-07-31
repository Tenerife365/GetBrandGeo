-- ============================================================================
-- Collection queue (SCALE-SPEC.md §3) — moves collection off the user's browser
-- tab onto a server-side scheduler (schedule-collections.js) + background worker
-- (collection-worker-background.js). Applied live 2026-07-15 via the Supabase
-- connector; this file is the record.
--
-- Idempotent — safe to re-run (IF NOT EXISTS everywhere; policies dropped first).
-- New empty tables; touches nothing that existing code reads/writes today, so
-- applying it before the functions ship is safe.
-- ============================================================================

-- ── 1. collection_runs — one row per enqueue batch (manual or scheduled). ──────
-- Mints the run_id that groups jobs and dedups ai_results. The browser polls this
-- (+ collection_jobs counts) for progress, instead of BEING the collection loop.
-- NB: the spec's §3.1 diagram names collection_runs but §3.2 only schematized
-- collection_jobs — this is that named-but-unschematized table, kept minimal.
CREATE TABLE IF NOT EXISTS public.collection_runs (
  id           bigserial PRIMARY KEY,
  client_id    int  NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  trigger      text NOT NULL DEFAULT 'manual',   -- manual | scheduled
  force        boolean NOT NULL DEFAULT false,
  total_jobs   int  NOT NULL DEFAULT 0,
  created_by   uuid,                              -- auth.users.id for manual runs; null for scheduled
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collection_runs_client
  ON public.collection_runs (client_id, created_at DESC);

-- ── 2. collection_jobs — the queue itself (SCALE-SPEC §3.2). ───────────────────
-- Deviation from the spec's minimal schema, documented on purpose: the job also
-- carries prompt_text + client_config + the market labels (a snapshot at enqueue
-- time), so the worker can run each job self-contained with no per-job joins —
-- the same "snapshot what the run needs onto the row" pattern audit-domain.js
-- already uses (it stores generated_prompts on the prospect_audits row). The
-- spec's schema omitted the fields the worker obviously needs to actually call
-- the engines; adding them beats forcing a join per claimed job.
CREATE TABLE IF NOT EXISTS public.collection_jobs (
  id            bigserial PRIMARY KEY,
  run_id        bigint NOT NULL REFERENCES public.collection_runs(id) ON DELETE CASCADE,
  client_id     int    NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  prompt_id     int    NOT NULL REFERENCES public.prompts(id)  ON DELETE CASCADE,
  prompt_text   text   NOT NULL,
  client_config jsonb  NOT NULL,
  market_id     text,
  market_label  text,
  region_label  text,
  engines       text[] NOT NULL,
  status        text   NOT NULL DEFAULT 'pending',   -- pending|running|done|failed
  attempts      int    NOT NULL DEFAULT 0,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  claimed_at    timestamptz,
  finished_at   timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_claim
  ON public.collection_jobs (status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_collection_jobs_client
  ON public.collection_jobs (client_id, status);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_run
  ON public.collection_jobs (run_id);

-- ── 3. ai_results dedup guard (SCALE-SPEC §3.2). ───────────────────────────────
-- The browser-serialized loop accidentally prevented double-writes; a concurrent
-- worker will not. The worker upserts with ON CONFLICT (run_id, prompt_id, llm),
-- and a PARTIAL unique index cannot be an ON CONFLICT target — so this is a PLAIN
-- unique index. Under default NULLS DISTINCT, every run_id-NULL row (all existing
-- rows + the manual "Refresh this prompt" endpoints, which stay run_id-less) is
-- distinct and therefore unconstrained — same effect as a partial index, but
-- usable as the worker's conflict target.
ALTER TABLE public.ai_results ADD COLUMN IF NOT EXISTS run_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_results_run_prompt_llm
  ON public.ai_results (run_id, prompt_id, llm);

-- ── 4. clients: refresh cadence for the scheduler. ─────────────────────────────
-- DEVIATION FROM SPEC, deliberate + flagged: the spec defaults refresh_cadence to
-- 'weekly'. That would silently opt EVERY existing client (incl. BpR + the 7
-- internal city-research clients, ids 10–16) into auto-refresh the moment the
-- scheduler goes live — the exact surprise-spend the spec's own §5.4 warns about.
-- Default 'manual' instead: the scheduler does NOTHING for a client until someone
-- explicitly sets a real cadence on that client. The queue + worker still serve
-- manual "Run collection" immediately; scheduled refresh is opt-in per client.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS refresh_cadence text DEFAULT 'manual',  -- manual|weekly|biweekly|monthly
  ADD COLUMN IF NOT EXISTS last_refresh_at timestamptz;

-- ── 5. claim_collection_jobs(batch_size) — atomic FOR UPDATE SKIP LOCKED. ──────
-- Supabase JS can't express FOR UPDATE SKIP LOCKED, so the worker claims a batch
-- through this function. SKIP LOCKED means two concurrent worker invocations never
-- grab the same job — which is what makes the worker safe to self-chain (and safe
-- against Netlify running two overlapping instances) without double-collecting.
-- SECURITY DEFINER + pinned empty search_path (matches the §11.5 F3 RLS-helper
-- hardening); fully-qualified names throughout.
CREATE OR REPLACE FUNCTION public.claim_collection_jobs(batch_size int)
RETURNS SETOF public.collection_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.collection_jobs j
  SET    status = 'running', claimed_at = now(), attempts = attempts + 1
  WHERE  j.id IN (
    SELECT id FROM public.collection_jobs
    WHERE  status = 'pending' AND scheduled_for <= now()
    ORDER  BY scheduled_for
    LIMIT  batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING j.*;
$$;
REVOKE ALL ON FUNCTION public.claim_collection_jobs(int) FROM public;
REVOKE ALL ON FUNCTION public.claim_collection_jobs(int) FROM anon;
REVOKE ALL ON FUNCTION public.claim_collection_jobs(int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_collection_jobs(int) TO service_role;

-- ── 6. RLS. ────────────────────────────────────────────────────────────────────
-- Writes: NONE for anon/authenticated (no INSERT/UPDATE/DELETE policies = deny).
--   Only the service_role key (scheduler/worker/enqueue endpoint) writes, via its
--   RLS bypass. Clients can NOT enqueue or mutate the queue directly.
-- Reads: per-client SELECT so the dashboard can POLL its own client's progress —
--   the exact my_role()/my_client_id() pattern the prompts/ai_results read
--   policies already use. Admins read all.
ALTER TABLE public.collection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collection_runs_select ON public.collection_runs;
CREATE POLICY collection_runs_select ON public.collection_runs
  FOR SELECT TO authenticated
  USING (my_role() = 'admin' OR client_id = my_client_id());

DROP POLICY IF EXISTS collection_jobs_select ON public.collection_jobs;
CREATE POLICY collection_jobs_select ON public.collection_jobs
  FOR SELECT TO authenticated
  USING (my_role() = 'admin' OR client_id = my_client_id());
