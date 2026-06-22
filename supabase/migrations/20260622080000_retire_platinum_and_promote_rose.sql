-- Rank ladder change: "Platinum" (rank 8) is retired — avatar id 35 ("Platinum
-- Echo") was mis-colored red, not platinum/silver. "Rose" is inserted at rank 7
-- (promoting id 21 "Rose Warden" out of the early-signup pool into the spin
-- pool), and "Gold" (ids 7, 40) shifts from rank 7 to rank 8.
--
-- The early-signup reward pool is retired entirely: ids 29, 21, 25, 33 are
-- deactivated. (id 21 lives on via the new spin-21 row below.)

-- 1. Deactivate the mis-colored Platinum slot and the retired early-signup pool.
update public.avatar_catalog
set is_active = false
where id in ('spin-35', 'signup-29', 'signup-21', 'signup-25', 'signup-33');

-- 2. Promote id 21 ("Rose Warden") into the spin pool at rank 7.
insert into public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, rarity, frame_color, rank_tier)
values
  ('spin-21', 110, 'Spin 21', '0', '/avatars/21.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common', 'rose', 7)
on conflict (id) do update set
  is_active = true,
  frame_color = 'rose',
  rank_tier = 7,
  image_src = excluded.image_src;

-- 3. Gold shifts from rank 7 to rank 8 for every catalog row backed by id 7 or 40.
update public.avatar_catalog
set rank_tier = 8
where frame_color = 'gold'
  and image_src in ('/avatars/7.png', '/avatars/40.png');

notify pgrst, 'reload schema';
