-- XP / level progression system (ported from vibe-weaver, adapted for wzwz).
-- XP sources: poll votes, onboarding, daily streak, community messages.

CREATE TABLE IF NOT EXISTS public.user_progress (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL UNIQUE,
  xp                    INTEGER NOT NULL DEFAULT 0 CONSTRAINT user_progress_xp_check CHECK (xp >= 0),
  level                 INTEGER NOT NULL DEFAULT 1,
  total_polls_answered  INTEGER NOT NULL DEFAULT 0,
  streak_days           INTEGER NOT NULL DEFAULT 0,
  last_active_date      DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_progress_select_own" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert_own" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_update_own" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_progress TO anon, authenticated;

-- Level thresholds: 1=0 2=100 3=250 4=500 5=1000 6=1750 7=2750 8=4000 9=5500 10=7500
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF xp_amount >= 7500 THEN RETURN 10;
  ELSIF xp_amount >= 5500 THEN RETURN 9;
  ELSIF xp_amount >= 4000 THEN RETURN 8;
  ELSIF xp_amount >= 2750 THEN RETURN 7;
  ELSIF xp_amount >= 1750 THEN RETURN 6;
  ELSIF xp_amount >= 1000 THEN RETURN 5;
  ELSIF xp_amount >= 500  THEN RETURN 4;
  ELSIF xp_amount >= 250  THEN RETURN 3;
  ELSIF xp_amount >= 100  THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;

-- XP thresholds per level (for progress-bar calculation)
CREATE OR REPLACE FUNCTION public.xp_for_level(target_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  CASE target_level
    WHEN 1  THEN RETURN 0;
    WHEN 2  THEN RETURN 100;
    WHEN 3  THEN RETURN 250;
    WHEN 4  THEN RETURN 500;
    WHEN 5  THEN RETURN 1000;
    WHEN 6  THEN RETURN 1750;
    WHEN 7  THEN RETURN 2750;
    WHEN 8  THEN RETURN 4000;
    WHEN 9  THEN RETURN 5500;
    WHEN 10 THEN RETURN 7500;
    ELSE RETURN 999999;
  END CASE;
END;
$$;

-- Auto-update level when XP changes
CREATE OR REPLACE FUNCTION public.update_level_on_xp_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level      := calculate_level(NEW.xp);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_level ON public.user_progress;
CREATE TRIGGER update_user_level
BEFORE UPDATE OF xp ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.update_level_on_xp_change();

-- Award XP atomically; creates row if missing; returns {xp, level, leveled_up}
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id UUID, p_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level INTEGER;
  v_new_xp    INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Upsert row
  INSERT INTO public.user_progress (user_id, xp)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE
    SET xp = user_progress.xp + GREATEST(0, p_amount);

  SELECT xp, level INTO v_new_xp, v_new_level
  FROM public.user_progress WHERE user_id = p_user_id;

  v_old_level := calculate_level(v_new_xp - p_amount);

  RETURN json_build_object(
    'xp',        v_new_xp,
    'level',     v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xp_for_level(INTEGER) TO anon, authenticated;
