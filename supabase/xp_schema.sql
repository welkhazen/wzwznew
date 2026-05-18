-- =============================================================
-- XP SCHEMA — run in Supabase SQL Editor
-- Adds user_progress and user_xp_claims tables + 4 RPCs
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id    TEXT PRIMARY KEY,
  xp         INT NOT NULL DEFAULT 0,
  level      INT NOT NULL DEFAULT 1,
  total_polls_answered INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_xp_claims (
  user_id   TEXT NOT NULL,
  source    TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, source, claim_key)
);

ALTER TABLE public.user_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xp_progress_all"  ON public.user_progress;
DROP POLICY IF EXISTS "xp_claims_all"    ON public.user_xp_claims;

CREATE POLICY "xp_progress_all" ON public.user_progress  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "xp_claims_all"   ON public.user_xp_claims FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.user_progress  TO anon, authenticated;
GRANT ALL ON public.user_xp_claims TO anon, authenticated;

-- =============================================================
-- HELPER: calculate level from XP (mirrors LEVEL_THRESHOLDS)
-- =============================================================

CREATE OR REPLACE FUNCTION public._xp_to_level(p_xp INT)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_xp >= 50000 THEN 10
    WHEN p_xp >= 38000 THEN 9
    WHEN p_xp >= 28000 THEN 8
    WHEN p_xp >= 19000 THEN 7
    WHEN p_xp >= 12000 THEN 6
    WHEN p_xp >= 7000  THEN 5
    WHEN p_xp >= 3500  THEN 4
    WHEN p_xp >= 1500  THEN 3
    WHEN p_xp >= 500   THEN 2
    ELSE 1
  END;
$$;

-- =============================================================
-- get_user_progress
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_user_progress(p_user_id TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE v user_progress%ROWTYPE;
BEGIN
  INSERT INTO user_progress (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v FROM user_progress WHERE user_id = p_user_id;
  RETURN json_build_object(
    'xp',                   v.xp,
    'level',                v.level,
    'total_polls_answered', v.total_polls_answered,
    'streak_days',          v.streak_days
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_progress(text) TO anon, authenticated;

-- =============================================================
-- award_xp
-- =============================================================

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id TEXT, p_amount INT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old_level INT;
  v_new_xp    INT;
  v_new_level INT;
BEGIN
  INSERT INTO user_progress (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT level INTO v_old_level FROM user_progress WHERE user_id = p_user_id;

  UPDATE user_progress
  SET xp = xp + GREATEST(0, p_amount), updated_at = now()
  WHERE user_id = p_user_id
  RETURNING xp INTO v_new_xp;

  v_new_level := public._xp_to_level(v_new_xp);

  UPDATE user_progress SET level = v_new_level WHERE user_id = p_user_id;

  RETURN json_build_object(
    'xp',       v_new_xp,
    'level',    v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_xp(text, int) TO anon, authenticated;

-- =============================================================
-- award_xp_once
-- =============================================================

CREATE OR REPLACE FUNCTION public.award_xp_once(
  p_user_id   TEXT,
  p_source    TEXT,
  p_claim_key TEXT,
  p_amount    INT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inserted  INT;
  v_awarded   json;
  v_progress  user_progress%ROWTYPE;
BEGIN
  INSERT INTO user_xp_claims (user_id, source, claim_key)
  VALUES (p_user_id, p_source, p_claim_key)
  ON CONFLICT (user_id, source, claim_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    INSERT INTO user_progress (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
    SELECT * INTO v_progress FROM user_progress WHERE user_id = p_user_id;
    RETURN json_build_object(
      'xp', v_progress.xp, 'level', v_progress.level,
      'leveled_up', false, 'awarded', false
    );
  END IF;

  SELECT public.award_xp(p_user_id, p_amount) INTO v_awarded;
  RETURN json_build_object(
    'xp',       (v_awarded->>'xp')::int,
    'level',    (v_awarded->>'level')::int,
    'leveled_up', (v_awarded->>'leveled_up')::boolean,
    'awarded',  true
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_xp_once(text, text, text, int) TO anon, authenticated;

-- =============================================================
-- get_user_xp_claim_keys
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_user_xp_claim_keys(p_user_id TEXT, p_source TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN ARRAY(
    SELECT claim_key FROM user_xp_claims
    WHERE user_id = p_user_id AND source = p_source
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_xp_claim_keys(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
