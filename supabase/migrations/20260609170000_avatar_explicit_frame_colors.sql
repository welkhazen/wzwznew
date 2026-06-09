-- Explicit frame_color backfill for every catalog row, keyed by the underlying
-- image id parsed from image_src. The heuristic in lib/avatarRank.ts was too
-- lossy ("Static Crown" -> R1 instead of rainbow, "Blu Fifer" -> R1 instead of
-- orange, "Neon Lynx" -> R1 instead of blue). Source of truth is now the table.

-- Helper: temporary mapping table from imageId -> frame_color.
create temporary table _avatar_frame_map (image_id integer primary key, frame_color text not null);

insert into _avatar_frame_map (image_id, frame_color) values
  (1,  'grey'),     -- Silver Ghost
  (2,  'orange'),   -- Amber Circuit
  (3,  'grey'),     -- Verdant Shade (green has no tier; default grey)
  (4,  'pink'),     -- Rose Signal
  (5,  'purple'),   -- Violet Fang
  (6,  'red'),      -- Crimson Muse
  (7,  'gold'),     -- Solar Flame
  (8,  'grey'),     -- Obsidian Drift
  (9,  'blue'),     -- Neon Husk
  (10, 'blue'),     -- Blue Signal
  (11, 'grey'),     -- Iron Halo
  (12, 'blue'),     -- Frost Oracle
  (13, 'red'),      -- Red Phantom
  (14, 'orange'),   -- Copper Saint
  (15, 'grey'),     -- Chrome Pulse
  (16, 'pink'),     -- Pink Circuit
  (17, 'grey'),     -- Void Runner
  (18, 'blue'),     -- Neon Lynx
  (19, 'rainbow'),  -- Static Crown
  (20, 'white'),    -- White Mirage
  (21, 'pink'),     -- Rose Warden
  (22, 'rainbow'),  -- Night Prism
  (23, 'blue'),     -- Cyan Specter
  (24, 'purple'),   -- Violet Mask
  (25, 'blue'),     -- Teal Siren
  (26, 'rainbow'),  -- Rainbow Pulse
  (27, 'grey'),     -- Black Comet
  (28, 'orange'),   -- Copper Echo
  (29, 'orange'),   -- Bronze Herald
  (30, 'grey'),     -- Quartz Reaper
  (31, 'white'),    -- Glass Monarch
  (32, 'white'),    -- Ivory Glitch
  (33, 'blue'),     -- Azure Shade
  (34, 'red'),      -- Scarlet Node
  (35, 'platinum'), -- Platinum Echo
  (36, 'grey'),     -- Green Relic (green has no tier)
  (37, 'purple'),   -- Purple Hex
  (38, 'orange'),   -- Ember Core
  (39, 'red'),      -- Ruby Signal
  (40, 'gold'),     -- Gold Warden
  (41, 'orange'),   -- Orange Vortex
  (42, 'blue'),     -- Blue Cipher
  (43, 'grey'),     -- Grey Sentinel
  (44, 'blue'),     -- Aqua Phantom
  (45, 'red'),      -- Rust Revenant
  (46, 'purple'),   -- Lilac Runner
  (47, 'pink'),     -- Pink Nova
  (48, 'blue'),     -- Teal Ghost
  (49, 'purple'),   -- Indigo Circuit
  (50, 'purple'),   -- Violet Pulse
  (51, 'red'),      -- Crimson Echo
  (52, 'purple'),   -- Purple Oracle
  (53, 'grey'),     -- Lime Warden (green has no tier)
  (54, 'white'),    -- Pearl Siren
  (55, 'pink'),     -- Blush Monarch
  (56, 'blue'),     -- Cyan Relic
  (57, 'pink'),     -- Magenta Shade
  (58, 'purple'),   -- Lavender Prism
  (59, 'pink');     -- Rose Comet

-- Update avatar_catalog by extracting the numeric image id from image_src.
update public.avatar_catalog c
set frame_color = m.frame_color,
    rank_tier = case m.frame_color
      when 'grey'     then 1
      when 'blue'     then 2
      when 'purple'   then 3
      when 'orange'   then 4
      when 'red'      then 5
      when 'pink'     then 6
      when 'gold'     then 7
      when 'platinum' then 8
      when 'white'    then 9
      when 'rainbow'  then 10
      else 1
    end
from _avatar_frame_map m
where c.image_src is not null
  and substring(c.image_src from '/avatars/(\d+)\.(?:png|webp|jpg|jpeg|svg)$')::int = m.image_id;

-- Fallback for any active row still missing a rank (no matching image_id, e.g.
-- the eight base SVG avatars): default to grey/R1.
update public.avatar_catalog
set frame_color = coalesce(frame_color, 'grey'),
    rank_tier   = coalesce(rank_tier, 1)
where frame_color is null or rank_tier is null;

notify pgrst, 'reload schema';
