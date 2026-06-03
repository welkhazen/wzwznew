-- Allow Supabase Auth users to create and maintain their own public profile
-- row. The profile id must match auth.uid(); no localStorage/user-provided id
-- is trusted for protected mutations.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

GRANT INSERT (
  id,
  username
) ON public.users TO authenticated;

GRANT UPDATE (
  avatar_level,
  onboarding_completed,
  profile_public
) ON public.users TO authenticated;

DROP POLICY IF EXISTS "users_auth_self_insert" ON public.users;
DROP POLICY IF EXISTS "users_auth_self_update" ON public.users;

CREATE POLICY "users_auth_self_insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "users_auth_self_update"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.delete_account(p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_user_id_text text;
BEGIN
  -- p_password is intentionally unused here. The frontend verifies the
  -- Supabase Auth password before calling this RPC; the database can only
  -- trust auth.uid(), not a legacy public.users.password_hash.
  PERFORM p_password;

  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  v_user_id_text := v_uid::text;

  IF to_regclass('public.user_aliases') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_aliases WHERE user_id = $1' USING v_uid;
  END IF;
  IF to_regclass('public.user_xp_claims') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_xp_claims WHERE user_id = $1' USING v_uid;
  END IF;
  IF to_regclass('public.user_progress') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_progress WHERE user_id = $1' USING v_uid;
  END IF;
  IF to_regclass('public.user_avatar_selection') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_avatar_selection WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.user_avatar_inventory') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_avatar_inventory WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.user_community_unlocks') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_community_unlocks WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.user_subscriptions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_subscriptions WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.notification_consents') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.notification_consents WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.community_waitlist') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.community_waitlist WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.community_members') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.community_members WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.community_poll_votes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.community_poll_votes WHERE user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.community_polls') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.community_polls WHERE created_by_user_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.community_messages') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.community_messages WHERE sender_id = $1' USING v_user_id_text;
    EXECUTE 'UPDATE public.community_messages SET liked_by = array_remove(liked_by, $1) WHERE $1 = ANY(liked_by)' USING v_user_id_text;
  END IF;
  IF to_regclass('public.community_requests') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.community_requests WHERE requester_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.issue_reports') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.issue_reports WHERE reporter_id = $1' USING v_user_id_text;
  END IF;
  IF to_regclass('public.communities') IS NOT NULL THEN
    EXECUTE 'UPDATE public.communities SET created_by = NULL WHERE created_by = $1' USING v_user_id_text;
  END IF;

  DELETE FROM public.users WHERE id = v_uid;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_account(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_account(text) TO authenticated, service_role;

DO $$
BEGIN
  IF to_regprocedure('public.get_community_access(text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_community_access(text) FROM anon, authenticated, PUBLIC;
  END IF;
  IF to_regprocedure('public.unlock_community(text,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.unlock_community(text, text) FROM anon, authenticated, PUBLIC;
  END IF;
  IF to_regprocedure('public.join_community_waitlist(text,text,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.join_community_waitlist(text, text, text) FROM anon, authenticated, PUBLIC;
  END IF;
  IF to_regprocedure('public.award_xp(uuid,integer)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer) FROM anon, authenticated, PUBLIC;
  END IF;
  IF to_regprocedure('public.award_xp_once(uuid,text,text,integer)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.award_xp_once(uuid, text, text, integer) FROM anon, authenticated, PUBLIC;
  END IF;
  IF to_regprocedure('public.get_user_progress(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_user_progress(uuid) FROM anon, authenticated, PUBLIC;
  END IF;
  IF to_regprocedure('public.get_user_xp_claim_keys(uuid,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.get_user_xp_claim_keys(uuid, text) FROM anon, authenticated, PUBLIC;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_community_access()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text := public.current_user_id()::text;
  v_has_sub boolean;
  v_ids text[];
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('has_subscription', false, 'unlocked_community_ids', ARRAY[]::text[]);
  END IF;

  SELECT COALESCE(
    (SELECT status = 'active' AND (expires_at IS NULL OR expires_at > now())
     FROM public.user_subscriptions WHERE user_id = v_uid),
    false
  ) INTO v_has_sub;

  SELECT COALESCE(ARRAY(
    SELECT community_id FROM public.user_community_unlocks WHERE user_id = v_uid
  ), '{}') INTO v_ids;

  RETURN json_build_object('has_subscription', v_has_sub, 'unlocked_community_ids', v_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_community(p_community_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_user_id text;
  v_already boolean;
  v_has_sub boolean;
  v_count integer;
  v_balance integer;
  free_slots constant integer := 2;
  token_cost constant integer := 10;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'already', false, 'free', false, 'balance', 0, 'error', 'unauthorized');
  END IF;
  v_user_id := v_uid::text;

  SELECT EXISTS(
    SELECT 1 FROM public.user_community_unlocks
    WHERE user_id = v_user_id AND community_id = p_community_id
  ) INTO v_already;

  IF v_already THEN
    SELECT token_balance INTO v_balance FROM public.users WHERE id = v_uid;
    RETURN json_build_object('ok', true, 'already', true, 'free', true, 'balance', COALESCE(v_balance, 0), 'error', null);
  END IF;

  SELECT COALESCE(
    (SELECT status = 'active' AND (expires_at IS NULL OR expires_at > now())
     FROM public.user_subscriptions WHERE user_id = v_user_id),
    false
  ) INTO v_has_sub;

  SELECT COUNT(*) INTO v_count FROM public.user_community_unlocks WHERE user_id = v_user_id;

  IF v_count < free_slots OR v_has_sub THEN
    INSERT INTO public.user_community_unlocks (user_id, community_id, tokens_spent)
    VALUES (v_user_id, p_community_id, 0)
    ON CONFLICT DO NOTHING;

    SELECT token_balance INTO v_balance FROM public.users WHERE id = v_uid;
    RETURN json_build_object('ok', true, 'already', false, 'free', true, 'balance', COALESCE(v_balance, 0), 'error', null);
  END IF;

  SELECT token_balance INTO v_balance FROM public.users WHERE id = v_uid;
  IF COALESCE(v_balance, 0) < token_cost THEN
    RETURN json_build_object('ok', false, 'already', false, 'free', false, 'balance', COALESCE(v_balance, 0), 'error', 'insufficient_tokens');
  END IF;

  UPDATE public.users SET token_balance = token_balance - token_cost WHERE id = v_uid
  RETURNING token_balance INTO v_balance;

  INSERT INTO public.user_community_unlocks (user_id, community_id, tokens_spent)
  VALUES (v_user_id, p_community_id, token_cost)
  ON CONFLICT DO NOTHING;

  RETURN json_build_object('ok', true, 'already', false, 'free', false, 'balance', v_balance, 'error', null);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_community_waitlist(p_community_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_user public.users%ROWTYPE;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_uid AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.community_waitlist (community_id, user_id, username)
  VALUES (p_community_id, v_uid::text, v_user.username)
  ON CONFLICT (community_id, user_id) DO NOTHING;

  SELECT count(*)::int INTO v_count
  FROM public.community_waitlist
  WHERE community_id = p_community_id;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp(p_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_progress public.user_progress%ROWTYPE;
  v_previous_level integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('xp', 0, 'level', 1, 'leveled_up', false);
  END IF;

  INSERT INTO public.user_progress (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_progress
  FROM public.user_progress
  WHERE user_id = v_uid;

  v_previous_level := v_progress.level;

  UPDATE public.user_progress
  SET xp = xp + GREATEST(0, p_amount),
      level = public.calculate_level(xp + GREATEST(0, p_amount)),
      updated_at = now()
  WHERE user_id = v_uid
  RETURNING * INTO v_progress;

  RETURN json_build_object(
    'xp', v_progress.xp,
    'level', v_progress.level,
    'leveled_up', v_progress.level > v_previous_level
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_progress()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_progress public.user_progress%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('xp', 0, 'level', 1, 'total_polls_answered', 0, 'streak_days', 0);
  END IF;

  INSERT INTO public.user_progress (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_progress
  FROM public.user_progress
  WHERE user_id = v_uid;

  RETURN json_build_object(
    'xp', v_progress.xp,
    'level', v_progress.level,
    'total_polls_answered', v_progress.total_polls_answered,
    'streak_days', v_progress.streak_days
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp_once(
  p_source text,
  p_claim_key text,
  p_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_claim_id uuid;
  v_award json;
  v_progress public.user_progress%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('xp', 0, 'level', 1, 'leveled_up', false, 'awarded', false);
  END IF;

  INSERT INTO public.user_xp_claims (user_id, source, claim_key, amount)
  VALUES (v_uid, p_source, p_claim_key, GREATEST(0, p_amount))
  ON CONFLICT (user_id, source, claim_key) DO NOTHING
  RETURNING id INTO v_claim_id;

  IF v_claim_id IS NULL THEN
    SELECT * INTO v_progress FROM public.user_progress WHERE user_id = v_uid;
    IF NOT FOUND THEN
      INSERT INTO public.user_progress (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
      SELECT * INTO v_progress FROM public.user_progress WHERE user_id = v_uid;
    END IF;

    RETURN json_build_object('xp', v_progress.xp, 'level', v_progress.level, 'leveled_up', false, 'awarded', false);
  END IF;

  v_award := public.award_xp(p_amount);

  RETURN json_build_object(
    'xp', (v_award->>'xp')::integer,
    'level', (v_award->>'level')::integer,
    'leveled_up', (v_award->>'leveled_up')::boolean,
    'awarded', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_xp_claim_keys(p_source text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
BEGIN
  IF v_uid IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  RETURN ARRAY(
    SELECT claim_key
    FROM public.user_xp_claims
    WHERE user_id = v_uid
      AND source = p_source
    ORDER BY created_at DESC
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_community_access() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unlock_community(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_community_waitlist(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp_once(text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_progress() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_xp_claim_keys(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_community_access() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlock_community(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_community_waitlist(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_xp(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_xp_once(text, text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_progress() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_xp_claim_keys(text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
