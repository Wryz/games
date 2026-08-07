-- Enable Row Level Security (RLS) on all score tables
-- DROP POLICY IF EXISTS avoids duplicate-policy errors on re-run

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

-- aim_trainer_scores
DROP POLICY IF EXISTS "Allow public read access on aim_trainer_scores" ON aim_trainer_scores;
DROP POLICY IF EXISTS "Allow public insert access on aim_trainer_scores" ON aim_trainer_scores;
DROP POLICY IF EXISTS "Allow public update access on aim_trainer_scores" ON aim_trainer_scores;
CREATE POLICY "Allow public read access on aim_trainer_scores" ON aim_trainer_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on aim_trainer_scores" ON aim_trainer_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on aim_trainer_scores" ON aim_trainer_scores FOR UPDATE USING (true);

-- typing_test_scores
DROP POLICY IF EXISTS "Allow public read access on typing_test_scores" ON typing_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on typing_test_scores" ON typing_test_scores;
DROP POLICY IF EXISTS "Allow public update access on typing_test_scores" ON typing_test_scores;
CREATE POLICY "Allow public read access on typing_test_scores" ON typing_test_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on typing_test_scores" ON typing_test_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on typing_test_scores" ON typing_test_scores FOR UPDATE USING (true);

-- memory_scores
DROP POLICY IF EXISTS "Allow public read access on memory_scores" ON memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on memory_scores" ON memory_scores;
DROP POLICY IF EXISTS "Allow public update access on memory_scores" ON memory_scores;
CREATE POLICY "Allow public read access on memory_scores" ON memory_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on memory_scores" ON memory_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on memory_scores" ON memory_scores FOR UPDATE USING (true);

-- reaction_time_scores
DROP POLICY IF EXISTS "Allow public read access on reaction_time_scores" ON reaction_time_scores;
DROP POLICY IF EXISTS "Allow public insert access on reaction_time_scores" ON reaction_time_scores;
DROP POLICY IF EXISTS "Allow public update access on reaction_time_scores" ON reaction_time_scores;
CREATE POLICY "Allow public read access on reaction_time_scores" ON reaction_time_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reaction_time_scores" ON reaction_time_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on reaction_time_scores" ON reaction_time_scores FOR UPDATE USING (true);

-- number_memory_scores
DROP POLICY IF EXISTS "Allow public read access on number_memory_scores" ON number_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on number_memory_scores" ON number_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on number_memory_scores" ON number_memory_scores;
CREATE POLICY "Allow public read access on number_memory_scores" ON number_memory_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on number_memory_scores" ON number_memory_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on number_memory_scores" ON number_memory_scores FOR UPDATE USING (true);

-- visual_memory_scores
DROP POLICY IF EXISTS "Allow public read access on visual_memory_scores" ON visual_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on visual_memory_scores" ON visual_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on visual_memory_scores" ON visual_memory_scores;
CREATE POLICY "Allow public read access on visual_memory_scores" ON visual_memory_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on visual_memory_scores" ON visual_memory_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on visual_memory_scores" ON visual_memory_scores FOR UPDATE USING (true);

-- stroop_test_scores
DROP POLICY IF EXISTS "Allow public read access on stroop_test_scores" ON stroop_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on stroop_test_scores" ON stroop_test_scores;
DROP POLICY IF EXISTS "Allow public update access on stroop_test_scores" ON stroop_test_scores;
CREATE POLICY "Allow public read access on stroop_test_scores" ON stroop_test_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on stroop_test_scores" ON stroop_test_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on stroop_test_scores" ON stroop_test_scores FOR UPDATE USING (true);

-- chimp_test_scores
DROP POLICY IF EXISTS "Allow public read access on chimp_test_scores" ON chimp_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on chimp_test_scores" ON chimp_test_scores;
DROP POLICY IF EXISTS "Allow public update access on chimp_test_scores" ON chimp_test_scores;
CREATE POLICY "Allow public read access on chimp_test_scores" ON chimp_test_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on chimp_test_scores" ON chimp_test_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on chimp_test_scores" ON chimp_test_scores FOR UPDATE USING (true);

-- time_estimation_scores
DROP POLICY IF EXISTS "Allow public read access on time_estimation_scores" ON time_estimation_scores;
DROP POLICY IF EXISTS "Allow public insert access on time_estimation_scores" ON time_estimation_scores;
DROP POLICY IF EXISTS "Allow public update access on time_estimation_scores" ON time_estimation_scores;
CREATE POLICY "Allow public read access on time_estimation_scores" ON time_estimation_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on time_estimation_scores" ON time_estimation_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on time_estimation_scores" ON time_estimation_scores FOR UPDATE USING (true);

-- maze_scores
DROP POLICY IF EXISTS "Allow public read access on maze_scores" ON maze_scores;
DROP POLICY IF EXISTS "Allow public insert access on maze_scores" ON maze_scores;
DROP POLICY IF EXISTS "Allow public update access on maze_scores" ON maze_scores;
CREATE POLICY "Allow public read access on maze_scores" ON maze_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on maze_scores" ON maze_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on maze_scores" ON maze_scores FOR UPDATE USING (true);

-- algebra_scores
DROP POLICY IF EXISTS "Allow public read access on algebra_scores" ON algebra_scores;
DROP POLICY IF EXISTS "Allow public insert access on algebra_scores" ON algebra_scores;
DROP POLICY IF EXISTS "Allow public update access on algebra_scores" ON algebra_scores;
CREATE POLICY "Allow public read access on algebra_scores" ON algebra_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on algebra_scores" ON algebra_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on algebra_scores" ON algebra_scores FOR UPDATE USING (true);

-- arithmetic_scores
DROP POLICY IF EXISTS "Allow public read access on arithmetic_scores" ON arithmetic_scores;
DROP POLICY IF EXISTS "Allow public insert access on arithmetic_scores" ON arithmetic_scores;
DROP POLICY IF EXISTS "Allow public update access on arithmetic_scores" ON arithmetic_scores;
CREATE POLICY "Allow public read access on arithmetic_scores" ON arithmetic_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on arithmetic_scores" ON arithmetic_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on arithmetic_scores" ON arithmetic_scores FOR UPDATE USING (true);

-- geometry_scores
DROP POLICY IF EXISTS "Allow public read access on geometry_scores" ON geometry_scores;
DROP POLICY IF EXISTS "Allow public insert access on geometry_scores" ON geometry_scores;
DROP POLICY IF EXISTS "Allow public update access on geometry_scores" ON geometry_scores;
CREATE POLICY "Allow public read access on geometry_scores" ON geometry_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on geometry_scores" ON geometry_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on geometry_scores" ON geometry_scores FOR UPDATE USING (true);

-- word_search_scores
DROP POLICY IF EXISTS "Allow public read access on word_search_scores" ON word_search_scores;
DROP POLICY IF EXISTS "Allow public insert access on word_search_scores" ON word_search_scores;
DROP POLICY IF EXISTS "Allow public update access on word_search_scores" ON word_search_scores;
CREATE POLICY "Allow public read access on word_search_scores" ON word_search_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on word_search_scores" ON word_search_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on word_search_scores" ON word_search_scores FOR UPDATE USING (true);

-- sudoku_scores
DROP POLICY IF EXISTS "Allow public read access on sudoku_scores" ON sudoku_scores;
DROP POLICY IF EXISTS "Allow public insert access on sudoku_scores" ON sudoku_scores;
DROP POLICY IF EXISTS "Allow public update access on sudoku_scores" ON sudoku_scores;
CREATE POLICY "Allow public read access on sudoku_scores" ON sudoku_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on sudoku_scores" ON sudoku_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on sudoku_scores" ON sudoku_scores FOR UPDATE USING (true);

-- Grant necessary permissions to anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
