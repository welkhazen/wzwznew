-- Update spin pool to one avatar per rank tier (R1 Grey → R11 S1).
-- Removes rank-duplicate entries (Purple Hex R5, Gold Warden R8),
-- adds Green Relic (R3), Gold Specter (R9), and restores Rainbow Pulse (R11 S1).

-- Deactivate removed entries
update public.avatar_catalog set is_active = false where id in ('spin-37', 'spin-40');

-- Add Green Relic (R3 Green, image /avatars/36.png)
insert into public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, rarity, drop_weight, frame_color, rank_tier)
values ('spin-36', 36, 'Green Relic', '0', '/avatars/36.png', '#060e06', '#4ade80', '#4ade80', '#4ade8080', true, 'common', 100, 'green', 3)
on conflict (id) do update set
  level = excluded.level,
  name = excluded.name,
  price = excluded.price,
  image_src = excluded.image_src,
  bg = excluded.bg,
  figure = excluded.figure,
  ring = excluded.ring,
  glow = excluded.glow,
  is_active = excluded.is_active,
  rarity = excluded.rarity,
  drop_weight = excluded.drop_weight,
  frame_color = excluded.frame_color,
  rank_tier = excluded.rank_tier;

-- Add Gold Specter (R9 Gold, image /avatars/23.png)
insert into public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, rarity, drop_weight, frame_color, rank_tier)
values ('spin-23', 23, 'Gold Specter', '0', '/avatars/23.png', '#16100a', '#facc15', '#facc15', '#facc1590', true, 'common', 100, 'gold', 9)
on conflict (id) do update set
  level = excluded.level,
  name = excluded.name,
  price = excluded.price,
  image_src = excluded.image_src,
  bg = excluded.bg,
  figure = excluded.figure,
  ring = excluded.ring,
  glow = excluded.glow,
  is_active = excluded.is_active,
  rarity = excluded.rarity,
  drop_weight = excluded.drop_weight,
  frame_color = excluded.frame_color,
  rank_tier = excluded.rank_tier;

-- Restore Rainbow Pulse (R11 S1, image /avatars/26.webp)
insert into public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, rarity, drop_weight, frame_color, rank_tier)
values ('spin-26', 26, 'Rainbow Pulse', '0', '/avatars/26.webp', '#0f0f1a', '#c084fc', '#c084fc', '#c084fc80', true, 'common', 100, 'rainbow', 11)
on conflict (id) do update set
  level = excluded.level,
  name = excluded.name,
  price = excluded.price,
  image_src = excluded.image_src,
  bg = excluded.bg,
  figure = excluded.figure,
  ring = excluded.ring,
  glow = excluded.glow,
  is_active = excluded.is_active,
  rarity = excluded.rarity,
  drop_weight = excluded.drop_weight,
  frame_color = excluded.frame_color,
  rank_tier = excluded.rank_tier;

notify pgrst, 'reload schema';
