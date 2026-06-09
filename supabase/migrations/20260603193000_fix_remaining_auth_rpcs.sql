-- Remove remaining user-id-as-authorization RPC surfaces.
-- These functions now derive identity from current_user_id(). While the app is
-- still on localStorage custom auth, protected calls fail closed until a real
-- Supabase Auth/Stytch server session is present.

DO $$
BEGIN
  IF to_regprocedure('public.complete_user_onboarding(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.complete_user_onboarding(uuid) FROM anon, authenticated, PUBLIC;
    DROP FUNCTION public.complete_user_onboarding(uuid);
  END IF;

  IF to_regprocedure('public.change_password(uuid,text,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.change_password(uuid, text, text) FROM anon, authenticated, PUBLIC;
    DROP FUNCTION public.change_password(uuid, text, text);
  END IF;

  IF to_regprocedure('public.delete_account(uuid,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.delete_account(uuid, text) FROM anon, authenticated, PUBLIC;
    DROP FUNCTION public.delete_account(uuid, text);
  END IF;

  IF to_regprocedure('public.toggle_message_like(uuid,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.toggle_message_like(uuid, text) FROM anon, authenticated, PUBLIC;
    DROP FUNCTION public.toggle_message_like(uuid, text);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.complete_user_onboarding()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'auth_migration_required');
  END IF;

  UPDATE public.users
  SET onboarding_completed = true
  WHERE id = v_uid
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.change_password(
  p_old_password text,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_user public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'auth_migration_required');
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE id = v_uid
    AND status = 'active';

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
  WHERE id = v_uid;

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_account(p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_user public.users%ROWTYPE;
  v_user_id_text text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'auth_migration_required');
  END IF;

  v_user_id_text := v_uid::text;

  SELECT * INTO v_user
  FROM public.users
  WHERE id = v_uid
    AND status = 'active';

  IF NOT FOUND
     OR v_user.password_hash IS NULL
     OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid password');
  END IF;

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

CREATE OR REPLACE FUNCTION public.toggle_message_like(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_user_id_text text;
  v_community_id text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_migration_required' USING ERRCODE = '28000';
  END IF;

  SELECT community_id INTO v_community_id
  FROM public.community_messages
  WHERE id = p_message_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'message_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = v_uid
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501';
  END IF;

  v_user_id_text := v_uid::text;

  IF NOT public.is_admin()
     AND NOT EXISTS (
       SELECT 1
       FROM public.community_members
       WHERE community_id = v_community_id
         AND user_id = v_user_id_text
     ) THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = '42501';
  END IF;

  UPDATE public.community_messages
  SET liked_by = CASE
    WHEN v_user_id_text = ANY(liked_by) THEN array_remove(liked_by, v_user_id_text)
    ELSE array_append(liked_by, v_user_id_text)
  END
  WHERE id = p_message_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_user_onboarding() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.change_password(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_account(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_message_like(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.complete_user_onboarding() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.change_password(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_account(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.toggle_message_like(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
