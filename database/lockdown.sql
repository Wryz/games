-- Lock the score tables down to read-only for clients.
--
-- Run this once in the Supabase SQL editor (project snzsigjseoduyjhqxbwn).
-- Safe to re-run.
--
-- Why: rls-policies.sql used to create an "Allow public update access on <table>"
-- policy (FOR UPDATE USING (true)) on each original score table and ran
-- GRANT ALL ... TO anon. Because the anon key is public, anyone could PATCH any
-- row through the REST API and rewrite scores or usernames.
--
-- The app never writes to the score tables directly: it inserts through the
-- submit_* RPCs (SECURITY DEFINER, so they run with the table owner's
-- privileges and are unaffected by this script) and reads with select /
-- realtime. So clients only need SELECT.
--
-- Direct INSERT is revoked too, because it let a client choose
--   * date_submitted (e.g. a far-future date to pin a row to the top of the
--     live feed / recent activity), and
--   * id (pre-claiming upcoming sequence values so later submit_* calls fail
--     with duplicate-key errors).
--
-- For each table this drops the public UPDATE and INSERT policies and resets
-- anon/authenticated to exactly SELECT. REVOKE ALL covers INSERT, UPDATE,
-- DELETE and TRUNCATE (which bypasses RLS) plus REFERENCES/TRIGGER/MAINTAIN.
-- Re-granting SELECT immediately after keeps reads and realtime working.

DO $$
DECLARE
  -- The 16 original tables. A missing one means this is the wrong database.
  core_tables TEXT[] := ARRAY[
    'aim_trainer_scores', 'typing_test_scores', 'memory_scores',
    'reaction_time_scores', 'number_memory_scores', 'visual_memory_scores',
    'stroop_test_scores', 'chimp_test_scores', 'time_estimation_scores',
    'maze_scores', 'algebra_scores', 'arithmetic_scores', 'geometry_scores',
    'word_search_scores', 'sudoku_scores', 'tangrams_scores'
  ];
  -- Tables from new_tests.sql. Supabase's default privileges grant them ALL,
  -- so normalise them too. Skipped if new_tests.sql hasn't been run yet.
  optional_tables TEXT[] := ARRAY[
    'verbal_memory_scores', 'flanker_scores', 'color_perception_scores',
    'mental_rotation_scores'
  ];
  t   TEXT;
  seq TEXT;
BEGIN
  FOREACH t IN ARRAY core_tables || optional_tables
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      IF t = ANY (core_tables) THEN
        RAISE EXCEPTION 'Table public.% does not exist - is this the right project?', t;
      END IF;
      RAISE NOTICE 'Skipping public.% (not created yet)', t;
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow public update access on ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow public insert access on ' || t, t);

    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);

    -- Only the submit_* RPCs (running as the table owner) call nextval().
    seq := pg_get_serial_sequence(format('public.%I', t), 'id');
    IF seq IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon, authenticated', seq);
    END IF;
  END LOOP;
END $$;

-- ── Verify ──────────────────────────────────────────────────────────────
-- Expected for every row: can_select true, every other can_* false,
-- write_policies 0.

SELECT
  c.relname                                     AS table_name,
  has_table_privilege('anon', c.oid, 'SELECT')   AS can_select,
  has_table_privilege('anon', c.oid, 'INSERT')   AS can_insert,
  has_table_privilege('anon', c.oid, 'UPDATE')   AS can_update,
  has_table_privilege('anon', c.oid, 'DELETE')   AS can_delete,
  has_table_privilege('anon', c.oid, 'TRUNCATE') AS can_truncate,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname
      AND p.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')) AS write_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE '%\_scores'
ORDER BY c.relname;
