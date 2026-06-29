-- Match the client NUMBERED_AVATAR_RANKS bumps for Quartz Reaper (white/R3)
-- and Green Relic (cyan/R2 — green has no native tier, blue is closest).
update public.avatar_catalog
set frame_color = 'white', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 30;

update public.avatar_catalog
set frame_color = 'blue', rank_tier = 2
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 36;

notify pgrst, 'reload schema';
