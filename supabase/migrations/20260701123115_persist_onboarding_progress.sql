ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_step text NOT NULL DEFAULT 'spin',
  ADD COLUMN IF NOT EXISTS onboarding_answered_poll_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS onboarding_selected_community_ids text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_onboarding_step_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_onboarding_step_check
  CHECK (onboarding_step IN (
    'spin',
    'username',
    'voucher',
    'early-signup-reward',
    'avatar',
    'polls',
    'profile',
    'communities',
    'marketplace',
    'ready'
  ));

CREATE OR REPLACE FUNCTION public.get_onboarding_progress()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'progress', json_build_object(
      'completed', v_user.onboarding_completed,
      'step', v_user.onboarding_step,
      'answeredPollIds', coalesce(v_user.onboarding_answered_poll_ids, ARRAY[]::text[]),
      'selectedCommunityIds', coalesce(v_user.onboarding_selected_community_ids, ARRAY[]::text[])
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_onboarding_progress(
  p_step text DEFAULT NULL,
  p_answered_poll_ids text[] DEFAULT NULL,
  p_selected_community_ids text[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_user_id();
  v_step text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'auth_migration_required');
  END IF;

  IF p_step IS NOT NULL AND p_step NOT IN (
    'spin',
    'username',
    'voucher',
    'early-signup-reward',
    'avatar',
    'polls',
    'profile',
    'communities',
    'marketplace',
    'ready'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_onboarding_step');
  END IF;

  UPDATE public.users
  SET
    onboarding_step = coalesce(p_step, onboarding_step),
    onboarding_answered_poll_ids = coalesce(p_answered_poll_ids, onboarding_answered_poll_ids),
    onboarding_selected_community_ids = coalesce(p_selected_community_ids, onboarding_selected_community_ids)
  WHERE id = v_uid
    AND status = 'active'
  RETURNING onboarding_step INTO v_step;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_onboarding_progress() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_onboarding_progress(text, text[], text[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_onboarding_progress() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_onboarding_progress(text, text[], text[]) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
