-- =============================================================
-- COMMUNITY ACCESS SCHEMA
-- Free tier (2 communities), token unlocks (10 each), subscriptions
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_community_unlocks (
  user_id      TEXT NOT NULL,
  community_id TEXT NOT NULL,
  tokens_spent INT NOT NULL DEFAULT 0,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, community_id)
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id    TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'inactive',
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_community_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unlocks_all"       ON public.user_community_unlocks;
DROP POLICY IF EXISTS "subscriptions_all" ON public.user_subscriptions;

CREATE POLICY "unlocks_all"       ON public.user_community_unlocks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "subscriptions_all" ON public.user_subscriptions     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.user_community_unlocks TO anon, authenticated;
GRANT ALL ON public.user_subscriptions     TO anon, authenticated;

-- =============================================================
-- get_community_access
-- Returns subscription status and list of unlocked community IDs
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_community_access(p_user_id TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_has_sub BOOL;
  v_ids     TEXT[];
BEGIN
  SELECT COALESCE(
    (SELECT status = 'active' AND (expires_at IS NULL OR expires_at > now())
     FROM user_subscriptions WHERE user_id = p_user_id),
    false
  ) INTO v_has_sub;

  SELECT COALESCE(ARRAY(
    SELECT community_id FROM user_community_unlocks WHERE user_id = p_user_id
  ), '{}') INTO v_ids;

  RETURN json_build_object(
    'has_subscription',       v_has_sub,
    'unlocked_community_ids', v_ids
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_community_access(text) TO anon, authenticated;

-- =============================================================
-- unlock_community
-- Free if user has < 2 unlocks or active subscription, else costs 10 tokens
-- Returns { ok, already, free, balance, error }
-- =============================================================

CREATE OR REPLACE FUNCTION public.unlock_community(
  p_user_id      TEXT,
  p_community_id TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_already  BOOL;
  v_has_sub  BOOL;
  v_count    INT;
  v_balance  INT;
  FREE_SLOTS CONSTANT INT := 2;
  TOKEN_COST CONSTANT INT := 10;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_community_unlocks
    WHERE user_id = p_user_id AND community_id = p_community_id
  ) INTO v_already;

  IF v_already THEN
    SELECT token_balance INTO v_balance FROM users WHERE id = p_user_id;
    RETURN json_build_object('ok', true, 'already', true, 'free', true, 'balance', COALESCE(v_balance, 0), 'error', null);
  END IF;

  SELECT COALESCE(
    (SELECT status = 'active' AND (expires_at IS NULL OR expires_at > now())
     FROM user_subscriptions WHERE user_id = p_user_id),
    false
  ) INTO v_has_sub;

  SELECT COUNT(*) INTO v_count FROM user_community_unlocks WHERE user_id = p_user_id;

  IF v_count < FREE_SLOTS OR v_has_sub THEN
    INSERT INTO user_community_unlocks (user_id, community_id, tokens_spent)
    VALUES (p_user_id, p_community_id, 0)
    ON CONFLICT DO NOTHING;

    SELECT token_balance INTO v_balance FROM users WHERE id = p_user_id;
    RETURN json_build_object('ok', true, 'already', false, 'free', true, 'balance', COALESCE(v_balance, 0), 'error', null);
  END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = p_user_id;
  IF COALESCE(v_balance, 0) < TOKEN_COST THEN
    RETURN json_build_object('ok', false, 'already', false, 'free', false, 'balance', COALESCE(v_balance, 0), 'error', 'insufficient_tokens');
  END IF;

  UPDATE users SET token_balance = token_balance - TOKEN_COST WHERE id = p_user_id
  RETURNING token_balance INTO v_balance;

  INSERT INTO user_community_unlocks (user_id, community_id, tokens_spent)
  VALUES (p_user_id, p_community_id, TOKEN_COST)
  ON CONFLICT DO NOTHING;

  RETURN json_build_object('ok', true, 'already', false, 'free', false, 'balance', v_balance, 'error', null);
END;
$$;
GRANT EXECUTE ON FUNCTION public.unlock_community(text, text) TO anon, authenticated;

-- =============================================================
-- activate_subscription
-- Sets subscription active for N months (called after payment)
-- =============================================================

CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id TEXT,
  p_months  INT DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_expires TIMESTAMPTZ;
BEGIN
  v_expires := now() + (p_months || ' months')::INTERVAL;

  INSERT INTO user_subscriptions (user_id, status, expires_at, updated_at)
  VALUES (p_user_id, 'active', v_expires, now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active', expires_at = EXCLUDED.expires_at, updated_at = now();

  RETURN json_build_object('ok', true, 'expires_at', v_expires);
END;
$$;
GRANT EXECUTE ON FUNCTION public.activate_subscription(text, int) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
