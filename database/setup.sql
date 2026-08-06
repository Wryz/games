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
  average_time INTEGER NOT NULL, -- in milliseconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chimp Test scores
CREATE TABLE IF NOT EXISTS chimp_test_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  patterns_remembered INTEGER NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Estimation scores
CREATE TABLE IF NOT EXISTS time_estimation_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  average_accuracy INTEGER NOT NULL, -- average error in milliseconds (lower is better)
  best_accuracy INTEGER NOT NULL, -- best (lowest) error in milliseconds (lower is better)
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maze scores
CREATE TABLE IF NOT EXISTS maze_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  time_taken INTEGER NOT NULL, -- in milliseconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Algebra scores
CREATE TABLE IF NOT EXISTS algebra_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  correct_answers INTEGER NOT NULL,
  average_time INTEGER NOT NULL, -- average response time in milliseconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arithmetic scores
CREATE TABLE IF NOT EXISTS arithmetic_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  correct_answers INTEGER NOT NULL,
  average_time INTEGER NOT NULL, -- average response time in milliseconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geometry scores
CREATE TABLE IF NOT EXISTS geometry_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  correct_answers INTEGER NOT NULL,
  average_time INTEGER NOT NULL, -- average response time in milliseconds
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Word Search scores
CREATE TABLE IF NOT EXISTS word_search_scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  characters_found INTEGER NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_reaction_time_username ON reaction_time_scores(username);
CREATE INDEX IF NOT EXISTS idx_reaction_time_date ON reaction_time_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_number_memory_username ON number_memory_scores(username);
CREATE INDEX IF NOT EXISTS idx_number_memory_date ON number_memory_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_visual_memory_username ON visual_memory_scores(username);
CREATE INDEX IF NOT EXISTS idx_visual_memory_date ON visual_memory_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_stroop_test_username ON stroop_test_scores(username);
CREATE INDEX IF NOT EXISTS idx_stroop_test_date ON stroop_test_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_chimp_test_username ON chimp_test_scores(username);
CREATE INDEX IF NOT EXISTS idx_chimp_test_date ON chimp_test_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_time_estimation_username ON time_estimation_scores(username);
CREATE INDEX IF NOT EXISTS idx_time_estimation_date ON time_estimation_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_maze_username ON maze_scores(username);
CREATE INDEX IF NOT EXISTS idx_maze_date ON maze_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_algebra_username ON algebra_scores(username);
CREATE INDEX IF NOT EXISTS idx_algebra_date ON algebra_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_arithmetic_username ON arithmetic_scores(username);
CREATE INDEX IF NOT EXISTS idx_arithmetic_date ON arithmetic_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_geometry_username ON geometry_scores(username);
CREATE INDEX IF NOT EXISTS idx_geometry_date ON geometry_scores(date_submitted);

CREATE INDEX IF NOT EXISTS idx_word_search_username ON word_search_scores(username);
CREATE INDEX IF NOT EXISTS idx_word_search_date ON word_search_scores(date_submitted);

-- =====================================================
-- 3. CREATE RPC FUNCTIONS FOR SCORE SUBMISSION
-- =====================================================

-- Function to submit aim trainer score
CREATE OR REPLACE FUNCTION submit_aim_trainer_score(
  p_username VARCHAR(50),
  p_accuracy DECIMAL(5,2),
  p_reaction_time INTEGER,
  p_targets_hit INTEGER,
  p_total_targets INTEGER
) RETURNS aim_trainer_scores AS $$
DECLARE
  new_score aim_trainer_scores;
BEGIN
  INSERT INTO aim_trainer_scores (username, accuracy, reaction_time, targets_hit, total_targets)
  VALUES (p_username, p_accuracy, p_reaction_time, p_targets_hit, p_total_targets)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit typing test score
CREATE OR REPLACE FUNCTION submit_typing_test_score(
  p_username VARCHAR(50),
  p_wpm INTEGER,
  p_accuracy DECIMAL(5,2),
  p_characters_typed INTEGER,
  p_time_taken INTEGER
) RETURNS typing_test_scores AS $$
DECLARE
  new_score typing_test_scores;
BEGIN
  INSERT INTO typing_test_scores (username, wpm, accuracy, characters_typed, time_taken)
  VALUES (p_username, p_wpm, p_accuracy, p_characters_typed, p_time_taken)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit memory score
CREATE OR REPLACE FUNCTION submit_memory_score(
  p_username VARCHAR(50),
  p_level_reached INTEGER,
  p_correct_sequences INTEGER,
  p_total_sequences INTEGER
) RETURNS memory_scores AS $$
DECLARE
  new_score memory_scores;
BEGIN
  INSERT INTO memory_scores (username, level_reached, correct_sequences, total_sequences)
  VALUES (p_username, p_level_reached, p_correct_sequences, p_total_sequences)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit reaction time score
CREATE OR REPLACE FUNCTION submit_reaction_time_score(
  p_username VARCHAR(50),
  p_average_time INTEGER,
  p_fastest_time INTEGER,
  p_attempts INTEGER
) RETURNS reaction_time_scores AS $$
DECLARE
  new_score reaction_time_scores;
BEGIN
  INSERT INTO reaction_time_scores (username, average_time, fastest_time, attempts)
  VALUES (p_username, p_average_time, p_fastest_time, p_attempts)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit number memory score
CREATE OR REPLACE FUNCTION submit_number_memory_score(
  p_username VARCHAR(50),
  p_longest_sequence INTEGER,
  p_attempts INTEGER
) RETURNS number_memory_scores AS $$
DECLARE
  new_score number_memory_scores;
BEGIN
  INSERT INTO number_memory_scores (username, longest_sequence, attempts)
  VALUES (p_username, p_longest_sequence, p_attempts)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit visual memory score
CREATE OR REPLACE FUNCTION submit_visual_memory_score(
  p_username VARCHAR(50),
  p_level_reached INTEGER,
  p_patterns_remembered INTEGER,
  p_total_patterns INTEGER
) RETURNS visual_memory_scores AS $$
DECLARE
  new_score visual_memory_scores;
BEGIN
  INSERT INTO visual_memory_scores (username, level_reached, patterns_remembered, total_patterns)
  VALUES (p_username, p_level_reached, p_patterns_remembered, p_total_patterns)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit stroop test score
CREATE OR REPLACE FUNCTION submit_stroop_test_score(
  p_username VARCHAR(50),
  p_correct_answers INTEGER,
  p_average_time INTEGER
) RETURNS stroop_test_scores AS $$
DECLARE
  new_score stroop_test_scores;
BEGIN
  INSERT INTO stroop_test_scores (username, correct_answers, average_time)
  VALUES (p_username, p_correct_answers, p_average_time)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit chimp test score
CREATE OR REPLACE FUNCTION submit_chimp_test_score(
  p_username VARCHAR(50),
  p_patterns_remembered INTEGER
) RETURNS chimp_test_scores AS $$
DECLARE
  new_score chimp_test_scores;
BEGIN
  INSERT INTO chimp_test_scores (username, patterns_remembered)
  VALUES (p_username, p_patterns_remembered)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit time estimation score
CREATE OR REPLACE FUNCTION submit_time_estimation_score(
  p_username VARCHAR(50),
  p_average_accuracy INTEGER,
  p_best_accuracy INTEGER
) RETURNS time_estimation_scores AS $$
DECLARE
  new_score time_estimation_scores;
BEGIN
  INSERT INTO time_estimation_scores (username, average_accuracy, best_accuracy)
  VALUES (p_username, p_average_accuracy, p_best_accuracy)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit maze score
CREATE OR REPLACE FUNCTION submit_maze_score(
  p_username VARCHAR(50),
  p_time_taken INTEGER
) RETURNS maze_scores AS $$
DECLARE
  new_score maze_scores;
BEGIN
  INSERT INTO maze_scores (username, time_taken)
  VALUES (p_username, p_time_taken)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit algebra score
CREATE OR REPLACE FUNCTION submit_algebra_score(
  p_username VARCHAR(50),
  p_correct_answers INTEGER,
  p_average_time INTEGER
) RETURNS algebra_scores AS $$
DECLARE
  new_score algebra_scores;
BEGIN
  INSERT INTO algebra_scores (username, correct_answers, average_time)
  VALUES (p_username, p_correct_answers, p_average_time)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit arithmetic score
CREATE OR REPLACE FUNCTION submit_arithmetic_score(
  p_username VARCHAR(50),
  p_correct_answers INTEGER,
  p_average_time INTEGER
) RETURNS arithmetic_scores AS $$
DECLARE
  new_score arithmetic_scores;
BEGIN
  INSERT INTO arithmetic_scores (username, correct_answers, average_time)
  VALUES (p_username, p_correct_answers, p_average_time)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit geometry score
CREATE OR REPLACE FUNCTION submit_geometry_score(
  p_username VARCHAR(50),
  p_correct_answers INTEGER,
  p_average_time INTEGER
) RETURNS geometry_scores AS $$
DECLARE
  new_score geometry_scores;
BEGIN
  INSERT INTO geometry_scores (username, correct_answers, average_time)
  VALUES (p_username, p_correct_answers, p_average_time)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit word search score
CREATE OR REPLACE FUNCTION submit_word_search_score(
  p_username VARCHAR(50),
  p_characters_found INTEGER
) RETURNS word_search_scores AS $$
DECLARE
  new_score word_search_scores;
BEGIN
  INSERT INTO word_search_scores (username, characters_found)
  VALUES (p_username, p_characters_found)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3B. CREATE RPC FUNCTIONS FOR FETCHING GAME OVERVIEW STATS
-- =====================================================

-- Function to get game stats overview for all games
CREATE OR REPLACE FUNCTION get_game_stats_overview(p_username VARCHAR(50) DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'game_id', game_id,
      'total_games', total_games,
      'top_score', top_score,
      'user_best', user_best
    )
  ) INTO result
  FROM (
    -- Aim Trainer
    SELECT 
      'aim-trainer' as game_id,
      (SELECT COUNT(*) FROM aim_trainer_scores) as total_games,
      COALESCE(
        -- First try to get perfect scores (100% accuracy), sorted by reaction time
        (SELECT json_build_object(
          'username', username,
          'accuracy', accuracy,
          'reaction_time', reaction_time,
          'targets_hit', targets_hit,
          'total_targets', total_targets,
          'date_submitted', date_submitted
        ) 
        FROM aim_trainer_scores 
        WHERE accuracy = 100 
        ORDER BY reaction_time ASC 
        LIMIT 1),
        -- Fallback: get highest accuracy if no perfect scores
        (SELECT json_build_object(
          'username', username,
          'accuracy', accuracy,
          'reaction_time', reaction_time,
          'targets_hit', targets_hit,
          'total_targets', total_targets,
          'date_submitted', date_submitted
        ) 
        FROM aim_trainer_scores 
        ORDER BY accuracy DESC, reaction_time ASC 
        LIMIT 1)
      ) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          COALESCE(
            -- First try to get user's perfect score
            (SELECT json_build_object(
              'accuracy', accuracy,
              'reaction_time', reaction_time,
              'targets_hit', targets_hit,
              'total_targets', total_targets,
              'date_submitted', date_submitted
            ) 
            FROM aim_trainer_scores 
            WHERE username = p_username AND accuracy = 100
            ORDER BY reaction_time ASC 
            LIMIT 1),
            -- Fallback: get user's best accuracy if no perfect score
            (SELECT json_build_object(
              'accuracy', accuracy,
              'reaction_time', reaction_time,
              'targets_hit', targets_hit,
              'total_targets', total_targets,
              'date_submitted', date_submitted
            ) 
            FROM aim_trainer_scores 
            WHERE username = p_username
            ORDER BY accuracy DESC, reaction_time ASC 
            LIMIT 1)
          )
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Typing Test
    SELECT 
      'typing-test' as game_id,
      (SELECT COUNT(*) FROM typing_test_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'wpm', wpm,
        'accuracy', accuracy,
        'characters_typed', characters_typed,
        'time_taken', time_taken,
        'date_submitted', date_submitted
      ) FROM typing_test_scores 
      ORDER BY wpm DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'wpm', wpm,
            'accuracy', accuracy,
            'characters_typed', characters_typed,
            'time_taken', time_taken,
            'date_submitted', date_submitted
          ) FROM typing_test_scores 
          WHERE username = p_username
          ORDER BY wpm DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Memory Game
    SELECT 
      'memory' as game_id,
      (SELECT COUNT(*) FROM memory_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'level_reached', level_reached,
        'correct_sequences', correct_sequences,
        'total_sequences', total_sequences,
        'date_submitted', date_submitted
      ) FROM memory_scores 
      ORDER BY level_reached DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'level_reached', level_reached,
            'correct_sequences', correct_sequences,
            'total_sequences', total_sequences,
            'date_submitted', date_submitted
          ) FROM memory_scores 
          WHERE username = p_username
          ORDER BY level_reached DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Reaction Time
    SELECT 
      'reaction-time' as game_id,
      (SELECT COUNT(*) FROM reaction_time_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'average_time', average_time,
        'fastest_time', fastest_time,
        'attempts', attempts,
        'date_submitted', date_submitted
      ) FROM reaction_time_scores 
      ORDER BY average_time ASC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'average_time', average_time,
            'fastest_time', fastest_time,
            'attempts', attempts,
            'date_submitted', date_submitted
          ) FROM reaction_time_scores 
          WHERE username = p_username
          ORDER BY average_time ASC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Number Memory
    SELECT 
      'number-memory' as game_id,
      (SELECT COUNT(*) FROM number_memory_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'longest_sequence', longest_sequence,
        'date_submitted', date_submitted
      ) FROM number_memory_scores 
      ORDER BY longest_sequence DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'longest_sequence', longest_sequence,
            'date_submitted', date_submitted
          ) FROM number_memory_scores 
          WHERE username = p_username
          ORDER BY longest_sequence DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Visual Memory
    SELECT 
      'visual-memory' as game_id,
      (SELECT COUNT(*) FROM visual_memory_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'level_reached', level_reached,
        'total_patterns', total_patterns,
        'date_submitted', date_submitted
      ) FROM visual_memory_scores 
      ORDER BY level_reached DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'level_reached', level_reached,
            'total_patterns', total_patterns,
            'date_submitted', date_submitted
          ) FROM visual_memory_scores 
          WHERE username = p_username
          ORDER BY level_reached DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Stroop Test
    SELECT 
      'stroop-test' as game_id,
      (SELECT COUNT(*) FROM stroop_test_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'correct_answers', correct_answers,
        'average_time', average_time,
        'date_submitted', date_submitted
      ) FROM stroop_test_scores 
      ORDER BY correct_answers DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'correct_answers', correct_answers,
            'average_time', average_time,
            'date_submitted', date_submitted
          ) FROM stroop_test_scores 
          WHERE username = p_username
          ORDER BY correct_answers DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Chimp Test
    SELECT 
      'chimp-test' as game_id,
      (SELECT COUNT(*) FROM chimp_test_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'patterns_remembered', patterns_remembered,
        'date_submitted', date_submitted
      ) FROM chimp_test_scores 
      ORDER BY patterns_remembered DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'patterns_remembered', patterns_remembered,
            'date_submitted', date_submitted
          ) FROM chimp_test_scores 
          WHERE username = p_username
          ORDER BY patterns_remembered DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Time Estimation
    SELECT 
      'time-estimation' as game_id,
      (SELECT COUNT(*) FROM time_estimation_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'average_accuracy', average_accuracy,
        'best_accuracy', best_accuracy,
        'date_submitted', date_submitted
      ) FROM time_estimation_scores 
      ORDER BY best_accuracy ASC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'average_accuracy', average_accuracy,
            'best_accuracy', best_accuracy,
            'date_submitted', date_submitted
          ) FROM time_estimation_scores 
          WHERE username = p_username
          ORDER BY best_accuracy ASC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Maze
    SELECT 
      'maze' as game_id,
      (SELECT COUNT(*) FROM maze_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'time_taken', time_taken,
        'date_submitted', date_submitted
      ) FROM maze_scores 
      ORDER BY time_taken ASC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'time_taken', time_taken,
            'date_submitted', date_submitted
          ) FROM maze_scores 
          WHERE username = p_username
          ORDER BY time_taken ASC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Algebra
    SELECT 
      'algebra' as game_id,
      (SELECT COUNT(*) FROM algebra_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'correct_answers', correct_answers,
        'average_time', average_time,
        'date_submitted', date_submitted
      ) FROM algebra_scores 
      ORDER BY correct_answers DESC, average_time ASC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'correct_answers', correct_answers,
            'average_time', average_time,
            'date_submitted', date_submitted
          ) FROM algebra_scores 
          WHERE username = p_username
          ORDER BY correct_answers DESC, average_time ASC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Arithmetic
    SELECT 
      'arithmetic' as game_id,
      (SELECT COUNT(*) FROM arithmetic_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'correct_answers', correct_answers,
        'average_time', average_time,
        'date_submitted', date_submitted
      ) FROM arithmetic_scores 
      ORDER BY correct_answers DESC, average_time ASC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'correct_answers', correct_answers,
            'average_time', average_time,
            'date_submitted', date_submitted
          ) FROM arithmetic_scores 
          WHERE username = p_username
          ORDER BY correct_answers DESC, average_time ASC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Geometry
    SELECT 
      'geometry' as game_id,
      (SELECT COUNT(*) FROM geometry_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'correct_answers', correct_answers,
        'average_time', average_time,
        'date_submitted', date_submitted
      ) FROM geometry_scores 
      ORDER BY correct_answers DESC, average_time ASC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'correct_answers', correct_answers,
            'average_time', average_time,
            'date_submitted', date_submitted
          ) FROM geometry_scores 
          WHERE username = p_username
          ORDER BY correct_answers DESC, average_time ASC 
          LIMIT 1)
        ELSE NULL
      END as user_best
    
    UNION ALL
    
    -- Word Search
    SELECT 
      'word-search' as game_id,
      (SELECT COUNT(*) FROM word_search_scores) as total_games,
      (SELECT json_build_object(
        'username', username,
        'characters_found', characters_found,
        'date_submitted', date_submitted
      ) FROM word_search_scores 
      ORDER BY characters_found DESC 
      LIMIT 1) as top_score,
      CASE 
        WHEN p_username IS NOT NULL THEN
          (SELECT json_build_object(
            'characters_found', characters_found,
            'date_submitted', date_submitted
          ) FROM word_search_scores 
          WHERE username = p_username
          ORDER BY characters_found DESC 
          LIMIT 1)
        ELSE NULL
      END as user_best
  ) as game_stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity across all games
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'game_id', game_id,
      'game_name', game_name,
      'username', username,
      'score_value', score_value,
      'date_submitted', date_submitted
    ) ORDER BY date_submitted DESC
  ) INTO result
  FROM (
    -- Aim Trainer
    SELECT 
      'aim-trainer' as game_id,
      'Aim Trainer' as game_name,
      username,
      json_build_object('accuracy', accuracy, 'reaction_time', reaction_time) as score_value,
      date_submitted
    FROM aim_trainer_scores
    
    UNION ALL
    
    -- Typing Test
    SELECT 
      'typing-test' as game_id,
      'Typing Test' as game_name,
      username,
      json_build_object('wpm', wpm, 'accuracy', accuracy) as score_value,
      date_submitted
    FROM typing_test_scores
    
    UNION ALL
    
    -- Memory Game
    SELECT 
      'memory' as game_id,
      'Memory Game' as game_name,
      username,
      json_build_object('level_reached', level_reached) as score_value,
      date_submitted
    FROM memory_scores
    
    UNION ALL
    
    -- Reaction Time
    SELECT 
      'reaction-time' as game_id,
      'Reaction Time' as game_name,
      username,
      json_build_object('average_time', average_time, 'fastest_time', fastest_time) as score_value,
      date_submitted
    FROM reaction_time_scores
    
    UNION ALL
    
    -- Number Memory
    SELECT 
      'number-memory' as game_id,
      'Number Memory' as game_name,
      username,
      json_build_object('longest_sequence', longest_sequence) as score_value,
      date_submitted
    FROM number_memory_scores
    
    UNION ALL
    
    -- Visual Memory
    SELECT 
      'visual-memory' as game_id,
      'Visual Memory' as game_name,
      username,
      json_build_object('level_reached', level_reached, 'total_patterns', total_patterns) as score_value,
      date_submitted
    FROM visual_memory_scores
    
    UNION ALL
    
    -- Stroop Test
    SELECT 
      'stroop-test' as game_id,
      'Stroop Test' as game_name,
      username,
      json_build_object('correct_answers', correct_answers) as score_value,
      date_submitted
    FROM stroop_test_scores
    
    UNION ALL
    
    -- Chimp Test
    SELECT 
      'chimp-test' as game_id,
      'Chimp Test' as game_name,
      username,
      json_build_object('patterns_remembered', patterns_remembered) as score_value,
      date_submitted
    FROM chimp_test_scores
    
    UNION ALL
    
    -- Time Estimation
    SELECT 
      'time-estimation' as game_id,
      'Time Estimation' as game_name,
      username,
      json_build_object('average_accuracy', average_accuracy, 'best_accuracy', best_accuracy) as score_value,
      date_submitted
    FROM time_estimation_scores
    
    UNION ALL
    
    -- Maze
    SELECT 
      'maze' as game_id,
      'Maze' as game_name,
      username,
      json_build_object('time_taken', time_taken) as score_value,
      date_submitted
    FROM maze_scores
    
    UNION ALL
    
    -- Algebra
    SELECT 
      'algebra' as game_id,
      'Algebra' as game_name,
      username,
      json_build_object('correct_answers', correct_answers, 'average_time', average_time) as score_value,
      date_submitted
    FROM algebra_scores
    
    UNION ALL
    
    -- Arithmetic
    SELECT 
      'arithmetic' as game_id,
      'Arithmetic' as game_name,
      username,
      json_build_object('correct_answers', correct_answers, 'average_time', average_time) as score_value,
      date_submitted
    FROM arithmetic_scores
    
    UNION ALL
    
    -- Geometry
    SELECT 
      'geometry' as game_id,
      'Geometry' as game_name,
      username,
      json_build_object('correct_answers', correct_answers, 'average_time', average_time) as score_value,
      date_submitted
    FROM geometry_scores
    
    UNION ALL
    
    -- Word Search
    SELECT 
      'word-search' as game_id,
      'Word Search' as game_name,
      username,
      json_build_object('characters_found', characters_found) as score_value,
      date_submitted
    FROM word_search_scores
    
    ORDER BY date_submitted DESC
    LIMIT p_limit
  ) as recent_scores;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable Row Level Security (RLS) on all tables
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
ALTER TABLE geometry_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_search_scores ENABLE ROW LEVEL SECURITY;

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

-- Policies for time_estimation_scores
DROP POLICY IF EXISTS "Allow public read access on time_estimation_scores" ON time_estimation_scores;
DROP POLICY IF EXISTS "Allow public insert access on time_estimation_scores" ON time_estimation_scores;
DROP POLICY IF EXISTS "Allow public update access on time_estimation_scores" ON time_estimation_scores;

CREATE POLICY "Allow public read access on time_estimation_scores" ON time_estimation_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on time_estimation_scores" ON time_estimation_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on time_estimation_scores" ON time_estimation_scores
    FOR UPDATE USING (true);

-- Policies for maze_scores
DROP POLICY IF EXISTS "Allow public read access on maze_scores" ON maze_scores;
DROP POLICY IF EXISTS "Allow public insert access on maze_scores" ON maze_scores;
DROP POLICY IF EXISTS "Allow public update access on maze_scores" ON maze_scores;

CREATE POLICY "Allow public read access on maze_scores" ON maze_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on maze_scores" ON maze_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on maze_scores" ON maze_scores
    FOR UPDATE USING (true);

-- Policies for algebra_scores
DROP POLICY IF EXISTS "Allow public read access on algebra_scores" ON algebra_scores;
DROP POLICY IF EXISTS "Allow public insert access on algebra_scores" ON algebra_scores;
DROP POLICY IF EXISTS "Allow public update access on algebra_scores" ON algebra_scores;

CREATE POLICY "Allow public read access on algebra_scores" ON algebra_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on algebra_scores" ON algebra_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on algebra_scores" ON algebra_scores
    FOR UPDATE USING (true);

-- Policies for arithmetic_scores
DROP POLICY IF EXISTS "Allow public read access on arithmetic_scores" ON arithmetic_scores;
DROP POLICY IF EXISTS "Allow public insert access on arithmetic_scores" ON arithmetic_scores;
DROP POLICY IF EXISTS "Allow public update access on arithmetic_scores" ON arithmetic_scores;

CREATE POLICY "Allow public read access on arithmetic_scores" ON arithmetic_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on arithmetic_scores" ON arithmetic_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on arithmetic_scores" ON arithmetic_scores
    FOR UPDATE USING (true);

-- Policies for geometry_scores
DROP POLICY IF EXISTS "Allow public read access on geometry_scores" ON geometry_scores;
DROP POLICY IF EXISTS "Allow public insert access on geometry_scores" ON geometry_scores;
DROP POLICY IF EXISTS "Allow public update access on geometry_scores" ON geometry_scores;

CREATE POLICY "Allow public read access on geometry_scores" ON geometry_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on geometry_scores" ON geometry_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on geometry_scores" ON geometry_scores
    FOR UPDATE USING (true);

-- Policies for word_search_scores
DROP POLICY IF EXISTS "Allow public read access on word_search_scores" ON word_search_scores;
DROP POLICY IF EXISTS "Allow public insert access on word_search_scores" ON word_search_scores;
DROP POLICY IF EXISTS "Allow public update access on word_search_scores" ON word_search_scores;

CREATE POLICY "Allow public read access on word_search_scores" ON word_search_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on word_search_scores" ON word_search_scores
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on word_search_scores" ON word_search_scores
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
