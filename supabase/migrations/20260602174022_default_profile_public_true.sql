-- New accounts should be public by default so the username/avatar/role/join
-- date show up on the Chat profile dialog the moment someone taps them.
-- Users can still opt out from the profile settings toggle.

ALTER TABLE public.users
  ALTER COLUMN profile_public SET DEFAULT true;

UPDATE public.users SET profile_public = true WHERE profile_public IS DISTINCT FROM true;

CREATE OR REPLACE FUNCTION public.signup_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
    RETURN json_build_object('ok', false, 'error', 'Username is already taken');
  END IF;
  v_id := gen_random_uuid();
  INSERT INTO users (id, username, password_hash, role, status, warnings, avatar_level, token_balance, onboarding_completed, profile_public)
  VALUES (v_id, trim(p_username), crypt(p_password, gen_salt('bf')), 'user', 'active', 0, 1, 50, false, true);
  RETURN json_build_object('ok', true, 'user', json_build_object(
    'id', v_id,
    'username', trim(p_username),
    'role', 'user',
    'status', 'active',
    'avatar_level', 1,
    'token_balance', 50,
    'onboarding_completed', false,
    'profile_public', true
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', false, 'error', 'Username is already taken');
END;
$$;

GRANT EXECUTE ON FUNCTION public.signup_user(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
