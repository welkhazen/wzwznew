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
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;

  IF NOT FOUND
     OR v_user.password_hash IS NULL
     OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid password');
  END IF;

  IF to_regclass('public.user_aliases') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_aliases WHERE user_id = $1' USING p_user_id;
  END IF;
  IF to_regclass('public.user_xp_claims') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_xp_claims WHERE user_id = $1' USING p_user_id;
  END IF;
  IF to_regclass('public.user_progress') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.user_progress WHERE user_id = $1' USING p_user_id;
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

  DELETE FROM public.users WHERE id = p_user_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_account(uuid, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
