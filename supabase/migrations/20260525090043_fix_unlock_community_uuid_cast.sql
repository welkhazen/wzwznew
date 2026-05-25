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
  v_user_uuid UUID;
  FREE_SLOTS CONSTANT INT := 2;
  TOKEN_COST CONSTANT INT := 10;
BEGIN
  v_user_uuid := p_user_id::UUID;

  SELECT EXISTS(
    SELECT 1 FROM user_community_unlocks
    WHERE user_id = p_user_id AND community_id = p_community_id
  ) INTO v_already;

  IF v_already THEN
    SELECT token_balance INTO v_balance FROM users WHERE id = v_user_uuid;
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

    SELECT token_balance INTO v_balance FROM users WHERE id = v_user_uuid;
    RETURN json_build_object('ok', true, 'already', false, 'free', true, 'balance', COALESCE(v_balance, 0), 'error', null);
  END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = v_user_uuid;
  IF COALESCE(v_balance, 0) < TOKEN_COST THEN
    RETURN json_build_object('ok', false, 'already', false, 'free', false, 'balance', COALESCE(v_balance, 0), 'error', 'insufficient_tokens');
  END IF;

  UPDATE users SET token_balance = token_balance - TOKEN_COST WHERE id = v_user_uuid
  RETURNING token_balance INTO v_balance;

  INSERT INTO user_community_unlocks (user_id, community_id, tokens_spent)
  VALUES (p_user_id, p_community_id, TOKEN_COST)
  ON CONFLICT DO NOTHING;

  RETURN json_build_object('ok', true, 'already', false, 'free', false, 'balance', v_balance, 'error', null);
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN json_build_object('ok', false, 'already', false, 'free', false, 'balance', 0, 'error', 'invalid_user_id');
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_community(text, text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
