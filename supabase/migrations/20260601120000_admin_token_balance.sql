-- Give admin a large token balance for testing. Idempotent.

UPDATE public.users
SET token_balance = 1000000
WHERE username = 'admin';
