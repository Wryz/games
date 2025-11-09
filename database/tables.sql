-- Create tables for each game's scores

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
