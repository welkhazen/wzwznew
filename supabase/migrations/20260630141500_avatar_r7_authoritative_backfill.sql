-- Correct stale R7 shop avatars whose rank metadata drifted in earlier
-- migrations. Update every authoritative catalog field together.
-- Temporary frontend guard keys: avatar-16 (Pink Circuit), avatar-47 (Pink Nova), avatar-51 (Crimson Echo).

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
    ('pink-circuit', 16, 'Pink Circuit', '1200', '/avatars/landing/pink-circuit.webp', '#2a0b1c', '#fb7185', '#fb7185', '#fb718580', true, 'common', 100, 'pink', 7),
    ('avatar-47',    47, 'Pink Nova', '1200', '/avatars/47.webp', '#0e0109', '#780848', '#780848', '#78084880', true, 'common', 100, 'pink', 7),
    ('avatar-51',    51, 'Crimson Echo', '1200', '/avatars/51.png', '#1a050b', '#d82858', '#d82858', '#d8285880', true, 'common', 100, 'pink', 7)
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
