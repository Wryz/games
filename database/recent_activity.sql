-- Function to get recent activity across all games
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 10)
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
    
    UNION ALL
    
    -- Sudoku
    SELECT 
      'sudoku' as game_id,
      'Sudoku' as game_name,
      username,
      json_build_object('time_taken', time_taken) as score_value,
      date_submitted
    FROM sudoku_scores
    
    ORDER BY date_submitted DESC
    LIMIT p_limit
  ) as recent_scores;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;