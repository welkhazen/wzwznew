CREATE OR REPLACE FUNCTION public.change_password(
  p_user_id uuid,
  p_old_password text,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND
     OR v_user.password_hash IS NULL
     OR v_user.password_hash != crypt(p_old_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid current password');
  END IF;

  IF length(coalesce(p_new_password, '')) < 6 THEN
    RETURN json_build_object('ok', false, 'error', 'Password must be at least 6 characters');
  END IF;

  UPDATE public.users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_password(uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_account(
  p_user_id uuid,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_user_id_text text := p_user_id::text;
BEGIN
  SELECT * INTO v_user
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND
     OR v_user.password_hash IS NULL
     OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid password');
  END IF;

  DELETE FROM public.user_aliases WHERE user_id = p_user_id;
  DELETE FROM public.user_xp_claims WHERE user_id = p_user_id;
  DELETE FROM public.user_progress WHERE user_id = p_user_id;

  DELETE FROM public.user_avatar_selection WHERE user_id = v_user_id_text;
  DELETE FROM public.user_avatar_inventory WHERE user_id = v_user_id_text;
  DELETE FROM public.user_community_unlocks WHERE user_id = v_user_id_text;
  DELETE FROM public.user_subscriptions WHERE user_id = v_user_id_text;
  DELETE FROM public.notification_consents WHERE user_id = v_user_id_text;
  DELETE FROM public.community_waitlist WHERE user_id = v_user_id_text;
  DELETE FROM public.community_members WHERE user_id = v_user_id_text;
  DELETE FROM public.community_poll_votes WHERE user_id = v_user_id_text;
  DELETE FROM public.community_polls WHERE created_by_user_id = v_user_id_text;
  DELETE FROM public.community_messages WHERE sender_id = v_user_id_text;
  UPDATE public.community_messages
  SET liked_by = array_remove(liked_by, v_user_id_text)
  WHERE v_user_id_text = ANY(liked_by);
  DELETE FROM public.community_requests WHERE requester_id = v_user_id_text;
  DELETE FROM public.issue_reports WHERE reporter_id = v_user_id_text;

  UPDATE public.communities
  SET created_by = NULL
  WHERE created_by = v_user_id_text;

  DELETE FROM public.users WHERE id = p_user_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account(uuid, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
