-- Correct avatar rank assignments to match updated NUMBERED_AVATAR_RANKS
-- These updates ensure the database avatar_catalog matches the client rank system

-- ID 17: Void Runner → R4 (Orange)
update public.avatar_catalog
set frame_color = 'orange', rank_tier = 4
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 17;

-- ID 27: Black Comet → R5 (Red)
update public.avatar_catalog
set frame_color = 'red', rank_tier = 5
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 27;

-- ID 53: Lime Warden → R2 (Blue)
update public.avatar_catalog
set frame_color = 'blue', rank_tier = 2
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 53;

-- ID 5: Blu Fifer → R5 (Red)
update public.avatar_catalog
set frame_color = 'red', rank_tier = 5
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 5;

-- ID 28: Copper Echo → R9 (White)
update public.avatar_catalog
set frame_color = 'white', rank_tier = 9
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 28;

-- ID 29: Bronze Herald → R7 (Pink)
update public.avatar_catalog
set frame_color = 'pink', rank_tier = 7
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 29;

-- ID 38: Ember Core → R8 (Gold)
update public.avatar_catalog
set frame_color = 'gold', rank_tier = 8
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 38;

-- ID 42: Orange Vortex → R5 (Red)
update public.avatar_catalog
set frame_color = 'red', rank_tier = 5
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 42;

-- ID 34: Scarlet Node → R10 (White)
update public.avatar_catalog
set frame_color = 'white', rank_tier = 10
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 34;

-- ID 57: Magenta Shade → R3 (Green)
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 57;

-- Purple tier avatars → R3 (Green) corrections:
-- ID 5: Violet Fang → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 5;

-- ID 37: Purple Hex → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 37;

-- ID 41: Purple Oracle → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 41;

-- ID 46: Lilac Runner → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 46;

-- ID 49: Indigo Circuit → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 49;

-- ID 50: Violet Pulse → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 50;

-- ID 58: Lavender Prism → R3
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 58;

-- ID 55: Blush Monarch → R7 (Pink)
update public.avatar_catalog
set frame_color = 'pink', rank_tier = 7
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 55;

-- ID 7: Solar Flame → R8 (Gold)
update public.avatar_catalog
set frame_color = 'gold', rank_tier = 8
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 7;

-- ID 32: Ivory Glitch → R3 (Green)
update public.avatar_catalog
set frame_color = 'green', rank_tier = 3
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 32;

-- ID 31: Glass Monarch → R8 (Gold)
update public.avatar_catalog
set frame_color = 'gold', rank_tier = 8
where image_src is not null
  and substring(image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = 31;

notify pgrst, 'reload schema';
