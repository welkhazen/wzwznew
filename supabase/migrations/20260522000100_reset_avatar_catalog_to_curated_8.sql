-- Replace avatar catalog contents with the curated 8-avatar set.
-- This removes previously inserted catalog entries and keeps only the requested avatars.

DELETE FROM public.avatar_catalog;

INSERT INTO public.avatar_catalog (
  id,
  level,
  name,
  price,
  image_src,
  bg,
  figure,
  ring,
  glow,
  is_active,
  is_new,
  show_in
) VALUES
  ('silver-void', 1, 'Silver Void', 'Free', '/avatars/1.webp', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, false, 'both'),
  ('neon-lynx', 2, 'Neon Lynx', 'Free', '/avatars/2.webp', '#170f2e', '#a855f7', '#c084fc', '#a855f780', true, false, 'both'),
  ('blue-signal', 3, 'Blue Signal', 'Free', '/avatars/3.webp', '#06131f', '#22d3ee', '#22d3ee', '#22d3ee80', true, false, 'both'),
  ('violet-mask', 4, 'Violet Mask', 'Free', '/avatars/4.webp', '#1a1028', '#d946ef', '#d946ef', '#d946ef80', true, false, 'both'),
  ('horned-iron', 5, 'Horned Iron', 'Free', '/avatars/5.webp', '#1f0a05', '#fb923c', '#fb923c', '#fb923c80', true, false, 'both'),
  ('crimson-muse', 6, 'Crimson Muse', 'Free', '/avatars/6.webp', '#2a0b0b', '#f97316', '#f97316', '#f9731680', true, false, 'both'),
  ('solar-flame', 7, 'Solar Flame', 'Free', '/avatars/7.webp', '#241005', '#facc15', '#facc15', '#facc1590', true, false, 'both'),
  ('pink-circuit', 8, 'Pink Circuit', 'Free', '/avatars/8.webp', '#2a0b1c', '#fb7185', '#fb7185', '#fb718580', true, false, 'both');
