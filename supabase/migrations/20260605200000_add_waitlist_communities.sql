-- Add 9 new locked/waitlist communities.
-- Safe to re-run; uses ON CONFLICT DO NOTHING.

INSERT INTO public.communities (id, abbr, title, description, topic, status, locked, created_at) VALUES
  ('bw',  'BW',  'Body... Wait',   'A candid space to talk about body image, self-perception, and the quiet battles we have with how we look and feel.',  'What''s one thing you''ve never said out loud about your body?',              'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c6',  'C6',  'Community 6',    'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c7',  'C7',  'Community 7',    'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c8',  'C8',  'Community 8',    'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c9',  'C9',  'Community 9',    'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c10', 'C10', 'Community 10',   'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c11', 'C11', 'Community 11',   'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c12', 'C12', 'Community 12',   'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z'),
  ('c13', 'C13', 'Community 13',   'Coming soon — a new space for raw, unfiltered conversations.',                                                          'What would you want to talk about here?',                                    'Early Access', true, '2026-06-05T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
