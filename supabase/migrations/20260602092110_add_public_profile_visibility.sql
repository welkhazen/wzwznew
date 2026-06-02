ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_public boolean NOT NULL DEFAULT false;

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
  VALUES (v_id, trim(p_username), crypt(p_password, gen_salt('bf')), 'user', 'active', 0, 1, 50, false, false);
  RETURN json_build_object('ok', true, 'user', json_build_object(
    'id', v_id,
    'username', trim(p_username),
    'role', 'user',
    'status', 'active',
    'avatar_level', 1,
    'token_balance', 50,
    'onboarding_completed', false,
    'profile_public', false
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', false, 'error', 'Username is already taken');
END;
$$;

GRANT EXECUTE ON FUNCTION public.signup_user(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.login_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = p_username;

  IF NOT FOUND OR v_user.password_hash IS NULL
     OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid username or password');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'role', v_user.role,
      'status', v_user.status,
      'avatar_level', v_user.avatar_level,
      'onboarding_completed', v_user.onboarding_completed,
      'profile_public', v_user.profile_public
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_user(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
