-- Backfill authoritative avatar catalog rows after moving source-of-truth back
-- to Supabase. These rows previously had partial rank/name/image corrections in
-- separate migrations, so update every authoritative field together.

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
    ('blue-signal', 11, 'Gold Specter', '50', '/avatars/23.png', '#16100a', '#facc15', '#facc15', '#facc1590', true, 'common', 100, 'gold', 9),
    ('blu-fifer',   20, 'Red Fifer',    '50', '/avatars/landing/blu-fifer.webp', '#0a1a2e', '#ef4444', '#ef4444', '#ef444480', true, 'common', 100, 'red', 6),
    ('spin-21',    110, 'Spin 21',       '0', '/avatars/21.png', '#111827', '#cbd5e1', '#cbd5e1', '#cbd5e180', true, 'common', 100, 'rose', 8),
    ('spin-23',     23, 'Gold Specter',  '0', '/avatars/23.png', '#16100a', '#facc15', '#facc15', '#facc1590', true, 'common', 100, 'gold', 9),
    ('spin-26',     26, 'Rainbow Pulse', '0', '/avatars/26.webp', '#0f0f1a', '#c084fc', '#c084fc', '#c084fc80', true, 'common', 100, 'rainbow', 11),
    ('spin-36',     36, 'Green Relic',   '0', '/avatars/36.png', '#060e06', '#4ade80', '#4ade80', '#4ade8080', true, 'common', 100, 'green', 3)
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
