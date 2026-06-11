-- Idempotent seed: admin user + core communities.
-- Safe to re-run; uses ON CONFLICT DO NOTHING.
--
-- The admin row is inserted with a locked password_hash placeholder that no
-- bcrypt comparison will ever match. The admin password MUST be rotated
-- out-of-band (e.g. via secure server-side RPC, the auth/users API, or a
-- one-off psql update) after this migration runs. Do NOT commit a real
-- password or any hash derived from a known plaintext into source control.

INSERT INTO public.users (id, username, password_hash, role, status, warnings, avatar_level)
VALUES (
  gen_random_uuid(),
  'admin',
  '!locked-set-via-secure-channel',
  'admin',
  'active',
  0,
  1
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.communities (id, abbr, title, description, topic, status, locked, created_at) VALUES
  ('lnt',  'LNT', 'Late Night Talks',    'Honest conversation when the world gets quiet and people finally say what they actually mean.',                          'What thought has been following you all week?',                  'Active',       false, '2026-04-01T00:00:00Z'),
  ('syt',  'SYT', 'Speak Your Truth',    'A space to say what you''ve been holding back. No filters, no judgment — just real voices sharing real experiences.',     'What''s something you''ve been afraid to say out loud?',         'Active',       false, '2026-04-01T00:00:00Z'),
  ('iijm', 'IIM', 'Is It Just Me?',      'Relatable moments, shared observations, and the quiet comfort of realizing you''re not the only one.',                    'What''s something you do or feel that you thought was only you?', 'Active',       false, '2026-04-01T00:00:00Z'),
  ('li',   'LI',  'Lebanese Initiatives','A space for Lebanese change-makers, community builders, and people driving impact inside Lebanon and across the diaspora.', 'What initiative or project are you working on right now?',       'Early Access', true,  '2026-04-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
