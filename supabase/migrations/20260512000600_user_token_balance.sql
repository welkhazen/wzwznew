-- Add token_balance to users table and helpers to read/spend it.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_balance int NOT NULL DEFAULT 0;

-- Atomically deduct tokens; returns {ok, balance} or {ok:false, error}
CREATE OR REPLACE FUNCTION public.spend_tokens(p_user_id uuid, p_amount int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance int;
BEGIN
  SELECT token_balance INTO v_balance FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'User not found');
  END IF;
  IF v_balance < p_amount THEN
    RETURN json_build_object('ok', false, 'error', 'Insufficient token balance');
  END IF;
  UPDATE users SET token_balance = token_balance - p_amount WHERE id = p_user_id;
  RETURN json_build_object('ok', true, 'balance', v_balance - p_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION public.spend_tokens(uuid, int) TO anon, authenticated;

-- Seed: give all admin accounts 1000 tokens
UPDATE public.users SET token_balance = 1000 WHERE role = 'admin' AND token_balance = 0;
