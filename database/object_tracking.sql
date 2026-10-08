-- New test: Object Tracking (Multiple Object Tracking, Pylyshyn & Storm 1988)
--
-- Run this once in the Supabase SQL editor, then re-run game_stats.sql and
-- recent_activity.sql so the overview and live feed include the new test.
-- Safe to re-run.

-- ── Table ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS object_tracking_scores (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  objects_tracked INTEGER NOT NULL CHECK (objects_tracked >= 0 AND objects_tracked <= 50),
  date_submitted TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS object_tracking_scores_username_idx ON object_tracking_scores (username);
CREATE INDEX IF NOT EXISTS object_tracking_scores_date_idx ON object_tracking_scores (date_submitted DESC);

-- ── Row Level Security ──────────────────────────────────────────────────
-- Public read only. No INSERT/UPDATE/DELETE policy: scores are written only
-- through submit_object_tracking_score below (SECURITY DEFINER), so clients
-- can't edit rows or insert with a chosen id / date_submitted.

ALTER TABLE object_tracking_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on object_tracking_scores" ON object_tracking_scores;
CREATE POLICY "Allow public read access on object_tracking_scores" ON object_tracking_scores FOR SELECT USING (true);

-- Supabase's default privileges grant ALL on new public tables to anon and
-- authenticated, so revoke everything before granting back SELECT.
-- (TRUNCATE is not subject to RLS.) Clients don't need the id sequence:
-- only the submit function calls nextval().
REVOKE ALL ON object_tracking_scores FROM anon, authenticated;
GRANT SELECT ON object_tracking_scores TO anon, authenticated;
REVOKE ALL ON SEQUENCE object_tracking_scores_id_seq FROM anon, authenticated;

-- ── Realtime (live feed + leaderboards) ─────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'object_tracking_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.object_tracking_scores;
  END IF;
END $$;

-- ── Submit function ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_object_tracking_score(
  p_username VARCHAR(50),
  p_objects_tracked INTEGER
) RETURNS object_tracking_scores AS $$
DECLARE
  new_score object_tracking_scores;
BEGIN
  INSERT INTO object_tracking_scores (username, objects_tracked)
  VALUES (p_username, p_objects_tracked)
  RETURNING * INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
