-- Force-reset the admin password on every run so the seeded credentials always work.
-- Safe to re-run.

INSERT INTO public.users (id, username, password_hash, role, status, warnings, avatar_level)
VALUES (
  gen_random_uuid(),
  'admin',
  crypt('Admin123!', gen_salt('bf')),
  'admin',
  'active',
  0,
  1
)
ON CONFLICT (username) DO UPDATE
SET password_hash = crypt('Admin123!', gen_salt('bf')),
    role = 'admin',
    status = 'active';
