-- Enable Row Level Security (RLS) on all tables
ALTER TABLE aim_trainer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_time_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stroop_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chimp_test_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for aim_trainer_scores
CREATE POLICY "Allow public read access on aim_trainer_scores" ON aim_trainer_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on aim_trainer_scores" ON aim_trainer_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on aim_trainer_scores" ON aim_trainer_scores
    FOR UPDATE USING (true);

-- Create policies for typing_test_scores
CREATE POLICY "Allow public read access on typing_test_scores" ON typing_test_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on typing_test_scores" ON typing_test_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on typing_test_scores" ON typing_test_scores
    FOR UPDATE USING (true);

-- Create policies for memory_scores
CREATE POLICY "Allow public read access on memory_scores" ON memory_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on memory_scores" ON memory_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on memory_scores" ON memory_scores
    FOR UPDATE USING (true);

-- Create policies for reaction_time_scores
CREATE POLICY "Allow public read access on reaction_time_scores" ON reaction_time_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on reaction_time_scores" ON reaction_time_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on reaction_time_scores" ON reaction_time_scores
    FOR UPDATE USING (true);

-- Create policies for number_memory_scores
CREATE POLICY "Allow public read access on number_memory_scores" ON number_memory_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on number_memory_scores" ON number_memory_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on number_memory_scores" ON number_memory_scores
    FOR UPDATE USING (true);

-- Create policies for visual_memory_scores
CREATE POLICY "Allow public read access on visual_memory_scores" ON visual_memory_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on visual_memory_scores" ON visual_memory_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on visual_memory_scores" ON visual_memory_scores
    FOR UPDATE USING (true);

-- Create policies for stroop_test_scores
CREATE POLICY "Allow public read access on stroop_test_scores" ON stroop_test_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on stroop_test_scores" ON stroop_test_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on stroop_test_scores" ON stroop_test_scores
    FOR UPDATE USING (true);

-- Create policies for chimp_test_scores
CREATE POLICY "Allow public read access on chimp_test_scores" ON chimp_test_scores
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on chimp_test_scores" ON chimp_test_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on chimp_test_scores" ON chimp_test_scores
    FOR UPDATE USING (true);

-- Grant necessary permissions to anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
