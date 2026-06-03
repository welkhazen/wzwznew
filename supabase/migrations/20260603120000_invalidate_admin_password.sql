-- Invalidate any admin password hash that may have been seeded from the
-- previously committed hardcoded value ('Admin123!'). Treat that password as
-- leaked. After this migration runs, the admin password must be rotated
-- out-of-band via a secure channel (server-side RPC or one-off psql update).
UPDATE public.users
SET password_hash = '!locked-set-via-secure-channel'
WHERE username = 'admin';
