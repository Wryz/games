-- Brain Benchmark Database Setup
-- Run this script in your Supabase SQL Editor to set up all tables and RLS policies

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Aim Trainer scores
CREATE TABLE IF NOT EXISTS aim_trainer_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  reaction_time INTEGER NOT NULL, -- in milliseconds
  targets_hit INTEGER NOT NULL,
  total_targets INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing Test scores
CREATE TABLE IF NOT EXISTS typing_test_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  wpm INTEGER NOT NULL, -- words per minute
  accuracy DECIMAL(5,2) NOT NULL,
  characters_typed INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory Game scores
CREATE TABLE IF NOT EXISTS memory_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  level_reached INTEGER NOT NULL,
  correct_sequences INTEGER NOT NULL,
  total_sequences INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pattern Recognition scores
CREATE TABLE IF NOT EXISTS pattern_recognition_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  patterns_solved INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  difficulty_level INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reaction Time scores
CREATE TABLE IF NOT EXISTS reaction_time_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  average_time INTEGER NOT NULL, -- in milliseconds
  fastest_time INTEGER NOT NULL, -- in milliseconds
  attempts INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Number Memory scores
CREATE TABLE IF NOT EXISTS number_memory_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  longest_sequence INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visual Memory scores
CREATE TABLE IF NOT EXISTS visual_memory_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  level_reached INTEGER NOT NULL,
  patterns_remembered INTEGER NOT NULL,
  total_patterns INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stroop Test scores
CREATE TABLE IF NOT EXISTS stroop_test_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  average_time INTEGER NOT NULL, -- in milliseconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequence Memory scores
CREATE TABLE IF NOT EXISTS sequence_memory_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  level_reached INTEGER NOT NULL,
  longest_sequence INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chimp Test scores
CREATE TABLE IF NOT EXISTS chimp_test_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  level_reached INTEGER NOT NULL,
  numbers_remembered INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aim_trainer_username ON aim_trainer_scores(username);
CREATE INDEX IF NOT EXISTS idx_aim_trainer_date ON aim_trainer_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_typing_test_username ON typing_test_scores(username);
CREATE INDEX IF NOT EXISTS idx_typing_test_date ON typing_test_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_memory_username ON memory_scores(username);
CREATE INDEX IF NOT EXISTS idx_memory_date ON memory_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_pattern_recognition_username ON pattern_recognition_scores(username);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_date ON pattern_recognition_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_reaction_time_username ON reaction_time_scores(username);
CREATE INDEX IF NOT EXISTS idx_reaction_time_date ON reaction_time_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_number_memory_username ON number_memory_scores(username);
CREATE INDEX IF NOT EXISTS idx_number_memory_date ON number_memory_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_visual_memory_username ON visual_memory_scores(username);
CREATE INDEX IF NOT EXISTS idx_visual_memory_date ON visual_memory_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_stroop_test_username ON stroop_test_scores(username);
CREATE INDEX IF NOT EXISTS idx_stroop_test_date ON stroop_test_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_sequence_memory_username ON sequence_memory_scores(username);
CREATE INDEX IF NOT EXISTS idx_sequence_memory_date ON sequence_memory_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_chimp_test_username ON chimp_test_scores(username);
CREATE INDEX IF NOT EXISTS idx_chimp_test_date ON chimp_test_scores(date_submitted);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE aim_trainer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_recognition_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_time_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE stroop_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chimp_test_scores ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES (PUBLIC ACCESS)
-- =====================================================

-- Policies for aim_trainer_scores
DROP POLICY IF EXISTS "Allow public read access on aim_trainer_scores" ON aim_trainer_scores;
DROP POLICY IF EXISTS "Allow public insert access on aim_trainer_scores" ON aim_trainer_scores;
DROP POLICY IF EXISTS "Allow public update access on aim_trainer_scores" ON aim_trainer_scores;

CREATE POLICY "Allow public read access on aim_trainer_scores" ON aim_trainer_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on aim_trainer_scores" ON aim_trainer_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on aim_trainer_scores" ON aim_trainer_scores
    FOR UPDATE USING (true);

-- Policies for typing_test_scores
DROP POLICY IF EXISTS "Allow public read access on typing_test_scores" ON typing_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on typing_test_scores" ON typing_test_scores;
DROP POLICY IF EXISTS "Allow public update access on typing_test_scores" ON typing_test_scores;

CREATE POLICY "Allow public read access on typing_test_scores" ON typing_test_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on typing_test_scores" ON typing_test_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on typing_test_scores" ON typing_test_scores
    FOR UPDATE USING (true);

-- Policies for memory_scores
DROP POLICY IF EXISTS "Allow public read access on memory_scores" ON memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on memory_scores" ON memory_scores;
DROP POLICY IF EXISTS "Allow public update access on memory_scores" ON memory_scores;

CREATE POLICY "Allow public read access on memory_scores" ON memory_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on memory_scores" ON memory_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on memory_scores" ON memory_scores
    FOR UPDATE USING (true);

-- Policies for pattern_recognition_scores
DROP POLICY IF EXISTS "Allow public read access on pattern_recognition_scores" ON pattern_recognition_scores;
DROP POLICY IF EXISTS "Allow public insert access on pattern_recognition_scores" ON pattern_recognition_scores;
DROP POLICY IF EXISTS "Allow public update access on pattern_recognition_scores" ON pattern_recognition_scores;

CREATE POLICY "Allow public read access on pattern_recognition_scores" ON pattern_recognition_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on pattern_recognition_scores" ON pattern_recognition_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on pattern_recognition_scores" ON pattern_recognition_scores
    FOR UPDATE USING (true);

-- Policies for reaction_time_scores
DROP POLICY IF EXISTS "Allow public read access on reaction_time_scores" ON reaction_time_scores;
DROP POLICY IF EXISTS "Allow public insert access on reaction_time_scores" ON reaction_time_scores;
DROP POLICY IF EXISTS "Allow public update access on reaction_time_scores" ON reaction_time_scores;

CREATE POLICY "Allow public read access on reaction_time_scores" ON reaction_time_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reaction_time_scores" ON reaction_time_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on reaction_time_scores" ON reaction_time_scores
    FOR UPDATE USING (true);

-- Policies for number_memory_scores
DROP POLICY IF EXISTS "Allow public read access on number_memory_scores" ON number_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on number_memory_scores" ON number_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on number_memory_scores" ON number_memory_scores;

CREATE POLICY "Allow public read access on number_memory_scores" ON number_memory_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on number_memory_scores" ON number_memory_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on number_memory_scores" ON number_memory_scores
    FOR UPDATE USING (true);

-- Policies for visual_memory_scores
DROP POLICY IF EXISTS "Allow public read access on visual_memory_scores" ON visual_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on visual_memory_scores" ON visual_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on visual_memory_scores" ON visual_memory_scores;

CREATE POLICY "Allow public read access on visual_memory_scores" ON visual_memory_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on visual_memory_scores" ON visual_memory_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on visual_memory_scores" ON visual_memory_scores
    FOR UPDATE USING (true);

-- Policies for stroop_test_scores
DROP POLICY IF EXISTS "Allow public read access on stroop_test_scores" ON stroop_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on stroop_test_scores" ON stroop_test_scores;
DROP POLICY IF EXISTS "Allow public update access on stroop_test_scores" ON stroop_test_scores;

CREATE POLICY "Allow public read access on stroop_test_scores" ON stroop_test_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on stroop_test_scores" ON stroop_test_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on stroop_test_scores" ON stroop_test_scores
    FOR UPDATE USING (true);

-- Policies for sequence_memory_scores
DROP POLICY IF EXISTS "Allow public read access on sequence_memory_scores" ON sequence_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on sequence_memory_scores" ON sequence_memory_scores;
DROP POLICY IF EXISTS "Allow public update access on sequence_memory_scores" ON sequence_memory_scores;

CREATE POLICY "Allow public read access on sequence_memory_scores" ON sequence_memory_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on sequence_memory_scores" ON sequence_memory_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on sequence_memory_scores" ON sequence_memory_scores
    FOR UPDATE USING (true);

-- Policies for chimp_test_scores
DROP POLICY IF EXISTS "Allow public read access on chimp_test_scores" ON chimp_test_scores;
DROP POLICY IF EXISTS "Allow public insert access on chimp_test_scores" ON chimp_test_scores;
DROP POLICY IF EXISTS "Allow public update access on chimp_test_scores" ON chimp_test_scores;

CREATE POLICY "Allow public read access on chimp_test_scores" ON chimp_test_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on chimp_test_scores" ON chimp_test_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on chimp_test_scores" ON chimp_test_scores
    FOR UPDATE USING (true);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Verify setup by checking if tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%_scores'
ORDER BY tablename;
