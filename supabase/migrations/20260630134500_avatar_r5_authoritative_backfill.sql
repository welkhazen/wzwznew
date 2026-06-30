-- Correct stale R5 shop avatars whose rank metadata drifted in earlier
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
    ('violet-mask', 12, 'Violet Mask', '300', '/avatars/24.png', '#1a1028', '#d946ef', '#d946ef', '#d946ef80', true, 'common', 100, 'purple', 5),
    ('horned-iron', 13, 'Violet Fang', '300', '/avatars/5.png', '#1f0a05', '#fb923c', '#fb923c', '#fb923c80', true, 'common', 100, 'purple', 5),
    ('avatar-32',   32, 'Ivory Glitch', '300', '/avatars/32.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common', 100, 'purple', 5),
    ('avatar-37',   37, 'Purple Hex', '300', '/avatars/37.png', '#070509', '#382848', '#382848', '#38284880', true, 'common', 100, 'purple', 5),
    ('avatar-41',   41, 'Purple Oracle', '300', '/avatars/41.webp', '#160e1e', '#b878f8', '#b878f8', '#b878f880', true, 'common', 100, 'purple', 5),
    ('avatar-46',   46, 'Lilac Runner', '300', '/avatars/46.png', '#18121c', '#c898e8', '#c898e8', '#c898e880', true, 'common', 100, 'purple', 5),
    ('avatar-49',   49, 'Indigo Circuit', '300', '/avatars/49.png', '#07030b', '#381858', '#381858', '#38185880', true, 'common', 100, 'purple', 5),
    ('avatar-57',   57, 'Magenta Shade', '300', '/avatars/57.png', '#180e1e', '#c878f8', '#c878f8', '#c878f880', true, 'common', 100, 'purple', 5),
    ('avatar-58',   58, 'Lavender Prism', '300', '/avatars/58.png', '#1a181e', '#d8c8f8', '#d8c8f8', '#d8c8f880', true, 'common', 100, 'purple', 5)
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
