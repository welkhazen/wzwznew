-- Correct Night Prism to its authoritative R3 price/rank.
-- Temporary frontend guard key: avatar-22.

update public.avatar_catalog as catalog
set level = 22,
    name = 'Night Prism',
    price = '100',
    image_src = '/avatars/22.png',
    bg = '#030509',
    figure = '#182848',
    ring = '#182848',
    glow = '#18284880',
    is_active = true,
    rarity = 'common',
    drop_weight = 100,
    frame_color = 'green',
    rank_tier = 3
where catalog.id = 'avatar-22';

notify pgrst, 'reload schema';
