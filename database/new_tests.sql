-- New tests: Verbal Memory, Flanker, Color Perception, Mental Rotation
--
-- Run this once in the Supabase SQL editor, then re-run game_stats.sql and
-- recent_activity.sql so the overview and live feed include the new tests.
-- Safe to re-run.

-- ── Tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verbal_memory_scores (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  words_remembered INTEGER NOT NULL CHECK (words_remembered >= 0 AND words_remembered <= 10000),
  date_submitted TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flanker_scores (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= 1000),
  average_time INTEGER NOT NULL CHECK (average_time >= 0),
  date_submitted TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS color_perception_scores (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  level_reached INTEGER NOT NULL CHECK (level_reached >= 0 AND level_reached <= 1000),
  date_submitted TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mental_rotation_scores (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= 1000),
  average_time INTEGER NOT NULL CHECK (average_time >= 0),
  date_submitted TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verbal_memory_scores_username_idx ON verbal_memory_scores (username);
CREATE INDEX IF NOT EXISTS verbal_memory_scores_date_idx ON verbal_memory_scores (date_submitted DESC);
CREATE INDEX IF NOT EXISTS flanker_scores_username_idx ON flanker_scores (username);
CREATE INDEX IF NOT EXISTS flanker_scores_date_idx ON flanker_scores (date_submitted DESC);
CREATE INDEX IF NOT EXISTS color_perception_scores_username_idx ON color_perception_scores (username);
CREATE INDEX IF NOT EXISTS color_perception_scores_date_idx ON color_perception_scores (date_submitted DESC);
CREATE INDEX IF NOT EXISTS mental_rotation_scores_username_idx ON mental_rotation_scores (username);
CREATE INDEX IF NOT EXISTS mental_rotation_scores_date_idx ON mental_rotation_scores (date_submitted DESC);

-- ── Row Level Security ──────────────────────────────────────────────────
-- Public read only. No INSERT/UPDATE/DELETE policy: scores are written only
-- through the submit_* functions below (SECURITY DEFINER), so clients can't
-- edit rows or insert with a chosen id / date_submitted. The insert-policy
-- DROPs remove the policy an earlier version of this file created.

ALTER TABLE verbal_memory_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE flanker_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_perception_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_rotation_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on verbal_memory_scores" ON verbal_memory_scores;
DROP POLICY IF EXISTS "Allow public insert access on verbal_memory_scores" ON verbal_memory_scores;
CREATE POLICY "Allow public read access on verbal_memory_scores" ON verbal_memory_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on flanker_scores" ON flanker_scores;
DROP POLICY IF EXISTS "Allow public insert access on flanker_scores" ON flanker_scores;
CREATE POLICY "Allow public read access on flanker_scores" ON flanker_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on color_perception_scores" ON color_perception_scores;
DROP POLICY IF EXISTS "Allow public insert access on color_perception_scores" ON color_perception_scores;
CREATE POLICY "Allow public read access on color_perception_scores" ON color_perception_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on mental_rotation_scores" ON mental_rotation_scores;
DROP POLICY IF EXISTS "Allow public insert access on mental_rotation_scores" ON mental_rotation_scores;
CREATE POLICY "Allow public read access on mental_rotation_scores" ON mental_rotation_scores FOR SELECT USING (true);

-- Supabase's default privileges grant ALL on new public tables to anon and
-- authenticated, so revoke everything before granting back SELECT.
-- (TRUNCATE is not subject to RLS.) Clients don't need the id sequences:
-- only the submit_* functions call nextval().
REVOKE ALL ON verbal_memory_scores, flanker_scores, color_perception_scores, mental_rotation_scores FROM anon, authenticated;
GRANT SELECT ON verbal_memory_scores, flanker_scores, color_perception_scores, mental_rotation_scores TO anon, authenticated;
REVOKE ALL ON SEQUENCE verbal_memory_scores_id_seq, flanker_scores_id_seq, color_perception_scores_id_seq, mental_rotation_scores_id_seq FROM anon, authenticated;

-- ── Realtime (live feed + leaderboards) ─────────────────────────────────

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['verbal_memory_scores', 'flanker_scores', 'color_perception_scores', 'mental_rotation_scores']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- ── Submit functions ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_verbal_memory_score(
  p_username VARCHAR(50),
  p_words_remembered INTEGER
) RETURNS verbal_memory_scores AS $$
DECLARE
  new_score verbal_memory_scores;
BEGIN
  INSERT INTO verbal_memory_scores (username, words_remembered)
  VALUES (p_username, p_words_remembered)
  RETURNING * INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_flanker_score(
  p_username VARCHAR(50),
  p_correct_answers INTEGER,
  p_average_time INTEGER
) RETURNS flanker_scores AS $$
DECLARE
  new_score flanker_scores;
BEGIN
  INSERT INTO flanker_scores (username, correct_answers, average_time)
  VALUES (p_username, p_correct_answers, p_average_time)
  RETURNING * INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_color_perception_score(
  p_username VARCHAR(50),
  p_level_reached INTEGER
) RETURNS color_perception_scores AS $$
DECLARE
  new_score color_perception_scores;
BEGIN
  INSERT INTO color_perception_scores (username, level_reached)
  VALUES (p_username, p_level_reached)
  RETURNING * INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_mental_rotation_score(
  p_username VARCHAR(50),
  p_correct_answers INTEGER,
  p_average_time INTEGER
) RETURNS mental_rotation_scores AS $$
DECLARE
  new_score mental_rotation_scores;
BEGIN
  INSERT INTO mental_rotation_scores (username, correct_answers, average_time)
  VALUES (p_username, p_correct_answers, p_average_time)
  RETURNING * INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
