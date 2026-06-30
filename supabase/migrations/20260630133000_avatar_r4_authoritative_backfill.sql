-- Correct stale R4 shop avatars whose rank metadata drifted in earlier
-- migrations. Update every authoritative catalog field together.

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
    ('crimson-muse', 14, 'Crimson Muse', '150', '/avatars/6.webp', '#2a0b0b', '#f97316', '#f97316', '#f9731680', true, 'common', 100, 'orange', 4),
    ('avatar-17',    17, 'Void Runner',  '150', '/avatars/17.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common', 100, 'orange', 4),
    ('avatar-42',    42, 'Orange Vortex','150', '/avatars/42.webp', '#0b0301', '#581808', '#581808', '#58180880', true, 'common', 100, 'orange', 4)
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
