-- Correct stale R9 shop avatars whose rank metadata drifted in earlier
-- migrations. Update every authoritative catalog field together.
-- Temporary frontend guard keys: avatar-23 (Gold Specter), avatar-38 (Ember Core).

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
    ('avatar-23', 23, 'Gold Specter', '5000', '/avatars/23.png', '#16100a', '#facc15', '#facc15', '#facc1590', true, 'common', 100, 'gold', 9),
    ('avatar-38', 38, 'Ember Core', '5000', '/avatars/38.png', '#090501', '#482808', '#482808', '#48280880', true, 'common', 100, 'gold', 9)
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
