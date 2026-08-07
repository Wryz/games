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
  p_longest_sequence INTEGER
) RETURNS number_memory_scores AS $$
DECLARE
  new_score number_memory_scores;
BEGIN
  INSERT INTO number_memory_scores (username, longest_sequence)
  VALUES (p_username, p_longest_sequence)
  RETURNING * INTO new_score;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit visual memory score
CREATE OR REPLACE FUNCTION submit_visual_memory_score(
  p_username VARCHAR(50),
  p_level_reached INTEGER,
  p_total_patterns INTEGER
) RETURNS visual_memory_scores AS $$
DECLARE
  new_score visual_memory_scores;
BEGIN
  INSERT INTO visual_memory_scores (username, level_reached, total_patterns)
  VALUES (p_username, p_level_reached, p_total_patterns)
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