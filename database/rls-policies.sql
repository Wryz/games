-- Enable Row Level Security (RLS) on all score tables
-- DROP POLICY IF EXISTS avoids duplicate-policy errors on re-run
--
-- Public read only. There is deliberately no INSERT/UPDATE/DELETE policy:
-- the anon key is public, and scores are only ever written by the submit_*
-- RPCs (SECURITY DEFINER, so they run as the table owner). The "insert access"
-- and "update access" DROPs below remove policies that older versions of this
-- file created. Existing databases: run lockdown.sql once.

ALTER TABLE aim_trainer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_time_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stroop_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chimp_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_estimation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE maze_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE algebra_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE arithmetic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE geometry_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_search_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sudoku_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tangrams_scores ENABLE ROW LEVEL SECURITY;

-- aim_trainer_scores
DROP POLICY IF EXISTS "Allow public read access on aim_trainer_scores" ON aim_trainer_scores;
DROP POLICY IF EXISTS "Allow public insert access on aim_trainer_scores" ON aim_trainer_scores;
DROP POLICY IF EXISTS "Allow public update access on aim_trainer_scores" ON aim_trainer_scores;
CREATE POLICY "Allow public read access on aim_trainer_scores" ON aim_trainer_scores FOR SELECT USING (true);

-- typing_test_scores
DROP POLICY IF EXISTS "Allow public read access on typing_test_scores" ON typing_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on typing_test_scores" ON typing_test_scores;
DROP POLICY IF EXISTS "Allow public update access on typing_test_scores" ON typing_test_scores;
CREATE POLICY "Allow public read access on typing_test_scores" ON typing_test_scores FOR SELECT USING (true);

-- memory_scores
DROP POLICY IF EXISTS "Allow public read access on memory_scores" ON memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on memory_scores" ON memory_scores;
DROP POLICY IF EXISTS "Allow public update access on memory_scores" ON memory_scores;
CREATE POLICY "Allow public read access on memory_scores" ON memory_scores FOR SELECT USING (true);

-- reaction_time_scores
DROP POLICY IF EXISTS "Allow public read access on reaction_time_scores" ON reaction_time_scores;
DROP POLICY IF EXISTS "Allow public insert access on reaction_time_scores" ON reaction_time_scores;
DROP POLICY IF EXISTS "Allow public update access on reaction_time_scores" ON reaction_time_scores;
CREATE POLICY "Allow public read access on reaction_time_scores" ON reaction_time_scores FOR SELECT USING (true);

-- number_memory_scores
DROP POLICY IF EXISTS "Allow public read access on number_memory_scores" ON number_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on number_memory_scores" ON number_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on number_memory_scores" ON number_memory_scores;
CREATE POLICY "Allow public read access on number_memory_scores" ON number_memory_scores FOR SELECT USING (true);

-- visual_memory_scores
DROP POLICY IF EXISTS "Allow public read access on visual_memory_scores" ON visual_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on visual_memory_scores" ON visual_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on visual_memory_scores" ON visual_memory_scores;
CREATE POLICY "Allow public read access on visual_memory_scores" ON visual_memory_scores FOR SELECT USING (true);

-- stroop_test_scores
DROP POLICY IF EXISTS "Allow public read access on stroop_test_scores" ON stroop_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on stroop_test_scores" ON stroop_test_scores;
DROP POLICY IF EXISTS "Allow public update access on stroop_test_scores" ON stroop_test_scores;
CREATE POLICY "Allow public read access on stroop_test_scores" ON stroop_test_scores FOR SELECT USING (true);

-- chimp_test_scores
DROP POLICY IF EXISTS "Allow public read access on chimp_test_scores" ON chimp_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on chimp_test_scores" ON chimp_test_scores;
DROP POLICY IF EXISTS "Allow public update access on chimp_test_scores" ON chimp_test_scores;
CREATE POLICY "Allow public read access on chimp_test_scores" ON chimp_test_scores FOR SELECT USING (true);

-- time_estimation_scores
DROP POLICY IF EXISTS "Allow public read access on time_estimation_scores" ON time_estimation_scores;
DROP POLICY IF EXISTS "Allow public insert access on time_estimation_scores" ON time_estimation_scores;
DROP POLICY IF EXISTS "Allow public update access on time_estimation_scores" ON time_estimation_scores;
CREATE POLICY "Allow public read access on time_estimation_scores" ON time_estimation_scores FOR SELECT USING (true);

-- maze_scores
DROP POLICY IF EXISTS "Allow public read access on maze_scores" ON maze_scores;
DROP POLICY IF EXISTS "Allow public insert access on maze_scores" ON maze_scores;
DROP POLICY IF EXISTS "Allow public update access on maze_scores" ON maze_scores;
CREATE POLICY "Allow public read access on maze_scores" ON maze_scores FOR SELECT USING (true);

-- algebra_scores
DROP POLICY IF EXISTS "Allow public read access on algebra_scores" ON algebra_scores;
DROP POLICY IF EXISTS "Allow public insert access on algebra_scores" ON algebra_scores;
DROP POLICY IF EXISTS "Allow public update access on algebra_scores" ON algebra_scores;
CREATE POLICY "Allow public read access on algebra_scores" ON algebra_scores FOR SELECT USING (true);

-- arithmetic_scores
DROP POLICY IF EXISTS "Allow public read access on arithmetic_scores" ON arithmetic_scores;
DROP POLICY IF EXISTS "Allow public insert access on arithmetic_scores" ON arithmetic_scores;
DROP POLICY IF EXISTS "Allow public update access on arithmetic_scores" ON arithmetic_scores;
CREATE POLICY "Allow public read access on arithmetic_scores" ON arithmetic_scores FOR SELECT USING (true);

-- geometry_scores
DROP POLICY IF EXISTS "Allow public read access on geometry_scores" ON geometry_scores;
DROP POLICY IF EXISTS "Allow public insert access on geometry_scores" ON geometry_scores;
DROP POLICY IF EXISTS "Allow public update access on geometry_scores" ON geometry_scores;
CREATE POLICY "Allow public read access on geometry_scores" ON geometry_scores FOR SELECT USING (true);

-- word_search_scores
DROP POLICY IF EXISTS "Allow public read access on word_search_scores" ON word_search_scores;
DROP POLICY IF EXISTS "Allow public insert access on word_search_scores" ON word_search_scores;
DROP POLICY IF EXISTS "Allow public update access on word_search_scores" ON word_search_scores;
CREATE POLICY "Allow public read access on word_search_scores" ON word_search_scores FOR SELECT USING (true);

-- sudoku_scores
DROP POLICY IF EXISTS "Allow public read access on sudoku_scores" ON sudoku_scores;
DROP POLICY IF EXISTS "Allow public insert access on sudoku_scores" ON sudoku_scores;
DROP POLICY IF EXISTS "Allow public update access on sudoku_scores" ON sudoku_scores;
CREATE POLICY "Allow public read access on sudoku_scores" ON sudoku_scores FOR SELECT USING (true);

-- tangrams_scores
DROP POLICY IF EXISTS "Allow public read access on tangrams_scores" ON tangrams_scores;
DROP POLICY IF EXISTS "Allow public insert access on tangrams_scores" ON tangrams_scores;
DROP POLICY IF EXISTS "Allow public update access on tangrams_scores" ON tangrams_scores;
CREATE POLICY "Allow public read access on tangrams_scores" ON tangrams_scores FOR SELECT USING (true);

-- Grant only what the app needs: SELECT (reads, realtime). Inserts go through
-- the submit_* RPCs, which don't need client privileges on the tables.
-- Supabase's default privileges give anon/authenticated ALL on new tables, so
-- revoke first; otherwise INSERT/UPDATE/DELETE/TRUNCATE grants would remain.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON
  aim_trainer_scores, typing_test_scores, memory_scores, reaction_time_scores,
  number_memory_scores, visual_memory_scores, stroop_test_scores, chimp_test_scores,
  time_estimation_scores, maze_scores, algebra_scores, arithmetic_scores,
  geometry_scores, word_search_scores, sudoku_scores, tangrams_scores
FROM anon, authenticated;

GRANT SELECT ON
  aim_trainer_scores, typing_test_scores, memory_scores, reaction_time_scores,
  number_memory_scores, visual_memory_scores, stroop_test_scores, chimp_test_scores,
  time_estimation_scores, maze_scores, algebra_scores, arithmetic_scores,
  geometry_scores, word_search_scores, sudoku_scores, tangrams_scores
TO anon, authenticated;

-- Clients don't need the id sequences either (only the RPCs call nextval()).
-- Looked up rather than hard-coded so serial and identity columns both work.
DO $$
DECLARE
  t   TEXT;
  seq TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'aim_trainer_scores', 'typing_test_scores', 'memory_scores',
    'reaction_time_scores', 'number_memory_scores', 'visual_memory_scores',
    'stroop_test_scores', 'chimp_test_scores', 'time_estimation_scores',
    'maze_scores', 'algebra_scores', 'arithmetic_scores', 'geometry_scores',
    'word_search_scores', 'sudoku_scores', 'tangrams_scores'
  ]
  LOOP
    seq := pg_get_serial_sequence(format('public.%I', t), 'id');
    IF seq IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon, authenticated', seq);
    END IF;
  END LOOP;
END $$;
