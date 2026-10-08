-- PROPOSAL - not part of the standard setup. Review the ranges before running.
--
-- Plausibility CHECKs for the 16 original score tables, in the spirit of the
-- CHECKs on the tables in new_tests.sql. They apply to every insert path
-- (submit_* RPCs and direct INSERT), so they also catch tampered clients.
--
-- Units, taken from components/games/*: times are milliseconds except
-- typing_test_scores.time_taken (seconds); accuracy columns are percentages
-- 0-100; time_estimation_scores.*_accuracy is an error in ms (lower = better).
-- Bounds are deliberately generous; tune them to the real game limits.
--
-- NOT VALID: existing rows are not checked, so this cannot fail on old
-- (possibly tampered) data, but every new row is. To check old rows later,
-- find violators with the commented query at the bottom, fix or delete them,
-- then run ALTER TABLE <table> VALIDATE CONSTRAINT <name>;
--
-- Safe to re-run (each constraint is dropped and re-added).

ALTER TABLE aim_trainer_scores
  DROP CONSTRAINT IF EXISTS aim_trainer_scores_plausible,
  ADD CONSTRAINT aim_trainer_scores_plausible CHECK (
    accuracy BETWEEN 0 AND 100
    AND reaction_time BETWEEN 50 AND 60000
    AND total_targets BETWEEN 0 AND 1000
    AND targets_hit BETWEEN 0 AND total_targets
  ) NOT VALID;

ALTER TABLE typing_test_scores
  DROP CONSTRAINT IF EXISTS typing_test_scores_plausible,
  ADD CONSTRAINT typing_test_scores_plausible CHECK (
    wpm BETWEEN 0 AND 300
    AND accuracy BETWEEN 0 AND 100
    AND characters_typed BETWEEN 0 AND 5000
    AND time_taken BETWEEN 1 AND 3600
  ) NOT VALID;

ALTER TABLE memory_scores
  DROP CONSTRAINT IF EXISTS memory_scores_plausible,
  ADD CONSTRAINT memory_scores_plausible CHECK (
    level_reached BETWEEN 0 AND 1000
    AND correct_sequences BETWEEN 0 AND 1000
    AND total_sequences BETWEEN 0 AND 1000
  ) NOT VALID;

ALTER TABLE reaction_time_scores
  DROP CONSTRAINT IF EXISTS reaction_time_scores_plausible,
  ADD CONSTRAINT reaction_time_scores_plausible CHECK (
    fastest_time > 50
    AND average_time BETWEEN fastest_time AND 10000
    AND attempts BETWEEN 1 AND 100
  ) NOT VALID;

ALTER TABLE number_memory_scores
  DROP CONSTRAINT IF EXISTS number_memory_scores_plausible,
  ADD CONSTRAINT number_memory_scores_plausible CHECK (
    longest_sequence BETWEEN 0 AND 200
  ) NOT VALID;

ALTER TABLE visual_memory_scores
  DROP CONSTRAINT IF EXISTS visual_memory_scores_plausible,
  ADD CONSTRAINT visual_memory_scores_plausible CHECK (
    level_reached BETWEEN 0 AND 1000
    AND total_patterns BETWEEN 0 AND 10000
  ) NOT VALID;

ALTER TABLE stroop_test_scores
  DROP CONSTRAINT IF EXISTS stroop_test_scores_plausible,
  ADD CONSTRAINT stroop_test_scores_plausible CHECK (
    correct_answers BETWEEN 0 AND 1000
    AND average_time BETWEEN 50 AND 60000
  ) NOT VALID;

ALTER TABLE chimp_test_scores
  DROP CONSTRAINT IF EXISTS chimp_test_scores_plausible,
  ADD CONSTRAINT chimp_test_scores_plausible CHECK (
    patterns_remembered BETWEEN 0 AND 1000
  ) NOT VALID;

ALTER TABLE time_estimation_scores
  DROP CONSTRAINT IF EXISTS time_estimation_scores_plausible,
  ADD CONSTRAINT time_estimation_scores_plausible CHECK (
    -- Errors above FAIL_THRESHOLD (5000 ms in TimeEstimation.tsx) are failures
    -- and never recorded.
    best_accuracy >= 0
    AND average_accuracy BETWEEN best_accuracy AND 5000
  ) NOT VALID;

ALTER TABLE maze_scores
  DROP CONSTRAINT IF EXISTS maze_scores_plausible,
  ADD CONSTRAINT maze_scores_plausible CHECK (
    time_taken BETWEEN 500 AND 86400000
  ) NOT VALID;

ALTER TABLE algebra_scores
  DROP CONSTRAINT IF EXISTS algebra_scores_plausible,
  ADD CONSTRAINT algebra_scores_plausible CHECK (
    correct_answers BETWEEN 0 AND 1000
    AND average_time BETWEEN 50 AND 600000
  ) NOT VALID;

ALTER TABLE arithmetic_scores
  DROP CONSTRAINT IF EXISTS arithmetic_scores_plausible,
  ADD CONSTRAINT arithmetic_scores_plausible CHECK (
    correct_answers BETWEEN 0 AND 1000
    AND average_time BETWEEN 50 AND 600000
  ) NOT VALID;

ALTER TABLE geometry_scores
  DROP CONSTRAINT IF EXISTS geometry_scores_plausible,
  ADD CONSTRAINT geometry_scores_plausible CHECK (
    correct_answers BETWEEN 0 AND 1000
    AND average_time BETWEEN 50 AND 600000
  ) NOT VALID;

ALTER TABLE word_search_scores
  DROP CONSTRAINT IF EXISTS word_search_scores_plausible,
  ADD CONSTRAINT word_search_scores_plausible CHECK (
    characters_found BETWEEN 0 AND 10000
  ) NOT VALID;

ALTER TABLE sudoku_scores
  DROP CONSTRAINT IF EXISTS sudoku_scores_plausible,
  ADD CONSTRAINT sudoku_scores_plausible CHECK (
    time_taken BETWEEN 10000 AND 86400000
  ) NOT VALID;

ALTER TABLE tangrams_scores
  DROP CONSTRAINT IF EXISTS tangrams_scores_plausible,
  ADD CONSTRAINT tangrams_scores_plausible CHECK (
    time_taken BETWEEN 1000 AND 86400000
  ) NOT VALID;

-- Find existing rows that would fail a constraint (swap in table + condition):
--
-- SELECT * FROM reaction_time_scores
-- WHERE NOT (fastest_time > 50 AND average_time BETWEEN fastest_time AND 10000
--            AND attempts BETWEEN 1 AND 100);
