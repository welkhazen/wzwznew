-- Catalog rows whose image_src is /avatars/landing/<slug>.webp don't carry a
-- numeric image id, so the previous backfill (which keyed off image id parsed
-- from the path) left them at the grey fallback. Patch them explicitly.

update public.avatar_catalog set frame_color = 'grey',   rank_tier = 1 where id = 'silver-void';
update public.avatar_catalog set frame_color = 'blue',   rank_tier = 2 where id in ('neon-lynx', 'blu-fifer', 'blue-signal');
update public.avatar_catalog set frame_color = 'purple', rank_tier = 3 where id = 'violet-mask';
update public.avatar_catalog set frame_color = 'red',    rank_tier = 5 where id in ('horned-iron', 'crimson-muse', 'viozen');
update public.avatar_catalog set frame_color = 'gold',   rank_tier = 7 where id = 'solar-flame';
update public.avatar_catalog set frame_color = 'pink',   rank_tier = 6 where id = 'pink-circuit';

notify pgrst, 'reload schema';
