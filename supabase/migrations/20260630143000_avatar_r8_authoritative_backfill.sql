-- Correct stale R8 shop avatars whose rank metadata drifted in earlier
-- migrations. Update every authoritative catalog field together.
-- Temporary frontend guard keys: avatar-21 (Rose Warden), avatar-29 (Bronze Herald), avatar-31 (Gold Warden), avatar-54 (Pearl Siren), avatar-55 (Blush Monarch).

with authoritative_rows (
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
  rarity,
  drop_weight,
  frame_color,
  rank_tier
) as (
  values
    ('avatar-21', 21, 'Rose Warden', '2500', '/avatars/21.png', '#16100a', '#facc15', '#facc15', '#facc1590', true, 'common', 100, 'rose', 8),
    ('avatar-29', 29, 'Bronze Herald', '2500', '/avatars/29.png', '#090501', '#482808', '#482808', '#48280880', true, 'common', 100, 'rose', 8),
    ('avatar-31', 31, 'Gold Warden', '2500', '/avatars/31.png', '#16100a', '#facc15', '#facc15', '#facc1590', true, 'common', 100, 'rose', 8),
    ('avatar-54', 54, 'Pearl Siren', '2500', '/avatars/54.png', '#1a1414', '#d8a8a8', '#d8a8a8', '#d8a8a880', true, 'common', 100, 'rose', 8),
    ('avatar-55', 55, 'Blush Monarch', '2500', '/avatars/55.png', '#1e1a1a', '#f8d8d8', '#f8d8d8', '#f8d8d880', true, 'common', 100, 'rose', 8)
)
update public.avatar_catalog as catalog
set level = authoritative_rows.level,
    name = authoritative_rows.name,
    price = authoritative_rows.price,
    image_src = authoritative_rows.image_src,
    bg = authoritative_rows.bg,
    figure = authoritative_rows.figure,
    ring = authoritative_rows.ring,
    glow = authoritative_rows.glow,
    is_active = authoritative_rows.is_active,
    rarity = authoritative_rows.rarity,
    drop_weight = authoritative_rows.drop_weight,
    frame_color = authoritative_rows.frame_color,
    rank_tier = authoritative_rows.rank_tier
from authoritative_rows
where catalog.id = authoritative_rows.id;

notify pgrst, 'reload schema';
