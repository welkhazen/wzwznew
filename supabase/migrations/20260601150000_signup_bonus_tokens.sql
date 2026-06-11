-- Grant 50 tokens to every new signup. Idempotent.

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
  INSERT INTO users (id, username, password_hash, role, status, warnings, avatar_level, token_balance)
  VALUES (v_id, trim(p_username), crypt(p_password, gen_salt('bf')), 'user', 'active', 0, 1, 50);
  RETURN json_build_object('ok', true, 'user', json_build_object(
    'id', v_id, 'username', trim(p_username), 'role', 'user', 'status', 'active', 'avatar_level', 1, 'token_balance', 50
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', false, 'error', 'Username is already taken');
END;
$$;

GRANT EXECUTE ON FUNCTION public.signup_user(text, text) TO anon, authenticated;

-- Also adjust the default so any other insert path picks it up.
ALTER TABLE public.users ALTER COLUMN token_balance SET DEFAULT 50;

NOTIFY pgrst, 'reload schema';
