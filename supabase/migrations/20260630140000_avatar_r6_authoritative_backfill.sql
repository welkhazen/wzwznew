-- Correct stale R6 shop avatars whose rank metadata drifted in earlier
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
    ('blu-fifer', 20, 'Red Fifer', '600', '/avatars/landing/blu-fifer.webp', '#0a1a2e', '#ef4444', '#ef4444', '#ef444480', true, 'common', 100, 'red', 6),
    ('avatar-27', 27, 'Black Comet', '600', '/avatars/27.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common', 100, 'red', 6),
    ('avatar-39', 39, 'Ruby Signal', '600', '/avatars/39.png', '#1e0e0e', '#f87878', '#f87878', '#f8787880', true, 'common', 100, 'red', 6)
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
