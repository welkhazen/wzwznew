-- Spin pool (order matters — used as the wheel order client-side).
insert into public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, rarity)
values
  ('spin-43', 100, 'Spin 43', '0', '/avatars/43.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-42', 101, 'Spin 42', '0', '/avatars/42.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-52', 102, 'Spin 52', '0', '/avatars/52.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-41', 103, 'Spin 41', '0', '/avatars/41.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-13', 104, 'Spin 13', '0', '/avatars/13.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-47', 105, 'Spin 47', '0', '/avatars/47.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-40', 106, 'Spin 40', '0', '/avatars/40.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('spin-20', 107, 'Spin 20', '0', '/avatars/20.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('signup-29', 200, 'Early Signup 29', '0', '/avatars/29.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('signup-21', 201, 'Early Signup 21', '0', '/avatars/21.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('signup-25', 202, 'Early Signup 25', '0', '/avatars/25.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common'),
  ('signup-33', 203, 'Early Signup 33', '0', '/avatars/33.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common')
on conflict (id) do update set
  image_src = excluded.image_src,
  name = excluded.name,
  is_active = true;
