-- Invalidate any admin password hash that may have been seeded from the
-- previously committed hardcoded value ('Admin123!'). Treat that password as
-- leaked. After this migration runs, the admin password must be rotated
-- out-of-band via a secure channel (server-side RPC or one-off psql update).
UPDATE public.users
SET password_hash = '!locked-set-via-secure-channel'
WHERE username = 'admin';

-- pgcrypto's crypt() raises "invalid salt" when the salt argument is not a
-- valid crypt setting. The locked sentinel above is not a valid bcrypt hash,
-- so login_user must short-circuit before calling crypt() to map the locked
-- state to a clean "invalid credentials" response instead of a runtime error.
CREATE OR REPLACE FUNCTION public.login_user(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = p_username;

  IF NOT FOUND
     OR v_user.password_hash IS NULL
     OR v_user.password_hash NOT LIKE '$%' THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid username or password');
  END IF;

  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid username or password');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'user', json_build_object(
      'id', v_user.id,
      'username', v_user.username,
      'role', v_user.role,
      'status', v_user.status,
      'avatar_level', v_user.avatar_level
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_user(text, text) TO anon, authenticated;
