-- Fix avatar names and ranks where artwork color doesn't match the name.
-- "Cyan Specter" (id=blue-signal, /avatars/23.png) is gold/orange artwork → R9 Gold.
-- "Blu Fifer"   (id=blu-fifer, landing webp) is red artwork → R6 Red.
-- The previous migration 20260626123000 tried to fix blu-fifer by numeric image id,
-- but that WHERE clause doesn't match the slug image path. This migration uses id directly.

update public.avatar_catalog
set name       = 'Gold Specter',
    frame_color = 'gold',
    rank_tier   = 9
where id = 'blue-signal';

update public.avatar_catalog
set name       = 'Red Fifer',
    frame_color = 'red',
    rank_tier   = 6
where id = 'blu-fifer';

notify pgrst, 'reload schema';
