-- Lock down score tables: read + insert only.
--
-- rls-policies.sql previously created a public UPDATE policy on every score
-- table and granted ALL privileges to anon/authenticated. Because the anon key
-- is public, anyone could PATCH any row through the REST API and rewrite
-- leaderboard scores or usernames.
--
-- The app never updates or deletes scores: it inserts through the
-- submit_*_score RPCs (SECURITY DEFINER) and reads with SELECT. This script
-- removes everything else. Run it once in the Supabase SQL editor.
-- Safe to re-run.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'aim_trainer_scores',
    'typing_test_scores',
    'memory_scores',
    'reaction_time_scores',
    'number_memory_scores',
    'visual_memory_scores',
    'stroop_test_scores',
    'chimp_test_scores',
    'time_estimation_scores',
    'maze_scores',
    'algebra_scores',
    'arithmetic_scores',
    'geometry_scores',
    'word_search_scores',
    'sudoku_scores',
    'tangrams_scores'
  ]
  LOOP
    -- Skip tables that don't exist in this project
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'Skipping missing table %', t;
      CONTINUE;
    END IF;

    -- 1. Remove the policy that let anyone edit any row
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow public update access on ' || t, t);

    -- 2. Make sure RLS stays on
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- 3. Defense in depth: revoke privileges the app never uses.
    --    TRUNCATE is not subject to RLS, so it must be revoked explicitly.
    EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT ON public.%I TO anon, authenticated', t);
  END LOOP;
END $$;

-- Sequences: inserts only need USAGE (nextval) and SELECT; not UPDATE (setval).
DO $$
DECLARE
  s RECORD;
BEGIN
  FOR s IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public' AND sequence_name LIKE '%\_scores\_id\_seq'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon, authenticated', s.sequence_name);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO anon, authenticated', s.sequence_name);
  END LOOP;
END $$;

-- ── Verify ─────────────────────────────────────────────────────────────
-- Should return zero rows (no UPDATE/DELETE policies on score tables):
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename LIKE '%\_scores' AND cmd IN ('UPDATE', 'DELETE', 'ALL');
--
-- Should list only SELECT and INSERT for anon on each score table:
--   SELECT table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE grantee = 'anon' AND table_schema = 'public' AND table_name LIKE '%\_scores'
--   ORDER BY table_name, privilege_type;
