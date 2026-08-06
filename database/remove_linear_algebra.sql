-- Migration: Remove Linear Algebra
-- Run this in the Supabase SQL editor against the live database.
-- Order: replace RPCs first (so they stop referencing the table), then drop function/table.

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

-- Drop submit RPC and table
DROP FUNCTION IF EXISTS submit_linear_algebra_score(VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS submit_linear_algebra_score(VARCHAR, INTEGER, INTEGER, VARCHAR);
DROP TABLE IF EXISTS linear_algebra_scores CASCADE;
