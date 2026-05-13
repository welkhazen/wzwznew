-- Insert all PNG avatar catalog rows (60x60 versions only).
-- Color themes per image set:
--   img_4395_0 → electric blue
--   img_4395_1 → violet phantom
--   img_4395_2 → toxic green
--   img_4395_3 → inferno orange
--   img_4756_2 → neon magenta
--   img_4756_3 → arctic cyan
--   img_4764_1 → solar gold
--
-- Levels 11-71 (SVG avatars occupy 1-10).

INSERT INTO avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, is_new, show_in) VALUES

-- Electric blue tech squad (img_4395_0) — levels 11-22
('img_4395_0_avatar_01_60x60', 11, 'Volt Edge',      '0', '/avatars/img_4395_0_avatar_01_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_02_60x60', 12, 'Neon Striker',   '0', '/avatars/img_4395_0_avatar_02_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_03_60x60', 13, 'Azure Knight',   '0', '/avatars/img_4395_0_avatar_03_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_04_60x60', 14, 'Pulse Echo',     '0', '/avatars/img_4395_0_avatar_04_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_05_60x60', 15, 'Cobalt Force',   '0', '/avatars/img_4395_0_avatar_05_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_06_60x60', 16, 'Static Surge',   '0', '/avatars/img_4395_0_avatar_06_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_07_60x60', 17, 'Electric Ghost', '0', '/avatars/img_4395_0_avatar_07_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_08_60x60', 18, 'Ionic Shield',   '0', '/avatars/img_4395_0_avatar_08_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_09_60x60', 19, 'Plasma Core',    '0', '/avatars/img_4395_0_avatar_09_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_10_60x60', 20, 'Cyber Wave',     '0', '/avatars/img_4395_0_avatar_10_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_11_60x60', 21, 'Binary Storm',   '0', '/avatars/img_4395_0_avatar_11_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),
('img_4395_0_avatar_12_60x60', 22, 'Quantum Drift',  '0', '/avatars/img_4395_0_avatar_12_60x60.png', '#060e18', '#5ed6ff', '#2ea6d6', '#5ed6ff80', true, true, 'both'),

-- Violet phantom squad (img_4395_1) — levels 23-31
('img_4395_1_avatar_01_60x60', 23, 'Dark Prism',    '0', '/avatars/img_4395_1_avatar_01_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_02_60x60', 24, 'Shadow Weave',  '0', '/avatars/img_4395_1_avatar_02_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_03_60x60', 25, 'Phantom Tide',  '0', '/avatars/img_4395_1_avatar_03_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_04_60x60', 26, 'Void Dancer',   '0', '/avatars/img_4395_1_avatar_04_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_05_60x60', 27, 'Astral Rift',   '0', '/avatars/img_4395_1_avatar_05_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_06_60x60', 28, 'Eclipse Born',  '0', '/avatars/img_4395_1_avatar_06_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_07_60x60', 29, 'Mystic Pulse',  '0', '/avatars/img_4395_1_avatar_07_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_08_60x60', 30, 'Nebula Drift',  '0', '/avatars/img_4395_1_avatar_08_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),
('img_4395_1_avatar_09_60x60', 31, 'Spectra Shade', '0', '/avatars/img_4395_1_avatar_09_60x60.png', '#0e0918', '#8b5cf6', '#5b2aa8', '#8b5cf680', true, true, 'both'),

-- Toxic green squad (img_4395_2) — levels 32-37
('img_4395_2_avatar_04_60x60', 32, 'Toxic Wraith',  '0', '/avatars/img_4395_2_avatar_04_60x60.png', '#071209', '#4ade80', '#16a34a', '#4ade8080', true, true, 'both'),
('img_4395_2_avatar_05_60x60', 33, 'Forest Shade',  '0', '/avatars/img_4395_2_avatar_05_60x60.png', '#071209', '#4ade80', '#16a34a', '#4ade8080', true, true, 'both'),
('img_4395_2_avatar_06_60x60', 34, 'Neon Viper',    '0', '/avatars/img_4395_2_avatar_06_60x60.png', '#071209', '#4ade80', '#16a34a', '#4ade8080', true, true, 'both'),
('img_4395_2_avatar_07_60x60', 35, 'Bio Circuit',   '0', '/avatars/img_4395_2_avatar_07_60x60.png', '#071209', '#4ade80', '#16a34a', '#4ade8080', true, true, 'both'),
('img_4395_2_avatar_08_60x60', 36, 'Acid Flash',    '0', '/avatars/img_4395_2_avatar_08_60x60.png', '#071209', '#4ade80', '#16a34a', '#4ade8080', true, true, 'both'),
('img_4395_2_avatar_09_60x60', 37, 'Sage Specter',  '0', '/avatars/img_4395_2_avatar_09_60x60.png', '#071209', '#4ade80', '#16a34a', '#4ade8080', true, true, 'both'),

-- Inferno orange squad (img_4395_3) — levels 38-40
('img_4395_3_avatar_01_60x60', 38, 'Blaze Surge',  '0', '/avatars/img_4395_3_avatar_01_60x60.png', '#180800', '#f97316', '#b0550f', '#f9731680', true, true, 'both'),
('img_4395_3_avatar_02_60x60', 39, 'Ember Storm',  '0', '/avatars/img_4395_3_avatar_02_60x60.png', '#180800', '#f97316', '#b0550f', '#f9731680', true, true, 'both'),
('img_4395_3_avatar_03_60x60', 40, 'Solar Flare',  '0', '/avatars/img_4395_3_avatar_03_60x60.png', '#180800', '#f97316', '#b0550f', '#f9731680', true, true, 'both'),

-- Neon magenta squad (img_4756_2) — levels 41-50
('img_4756_2_avatar_01_60x60', 41, 'Neon Rose',     '0', '/avatars/img_4756_2_avatar_01_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_02_60x60', 42, 'Fuchsia Shade', '0', '/avatars/img_4756_2_avatar_02_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_03_60x60', 43, 'Sakura Ghost',  '0', '/avatars/img_4756_2_avatar_03_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_04_60x60', 44, 'Pink Phantom',  '0', '/avatars/img_4756_2_avatar_04_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_05_60x60', 45, 'Magenta Rift',  '0', '/avatars/img_4756_2_avatar_05_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_06_60x60', 46, 'Vivid Storm',   '0', '/avatars/img_4756_2_avatar_06_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_07_60x60', 47, 'Ultraviolet',   '0', '/avatars/img_4756_2_avatar_07_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_08_60x60', 48, 'Rose Specter',  '0', '/avatars/img_4756_2_avatar_08_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_09_60x60', 49, 'Bloom Surge',   '0', '/avatars/img_4756_2_avatar_09_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),
('img_4756_2_avatar_11_60x60', 50, 'Iris Wraith',   '0', '/avatars/img_4756_2_avatar_11_60x60.png', '#180510', '#ec4899', '#a6235f', '#ec489980', true, true, 'both'),

-- Arctic cyan squad (img_4756_3) — levels 51-62
('img_4756_3_avatar_01_60x60', 51, 'Frost Shade',   '0', '/avatars/img_4756_3_avatar_01_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_02_60x60', 52, 'Arctic Wraith', '0', '/avatars/img_4756_3_avatar_02_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_03_60x60', 53, 'Glacier Edge',  '0', '/avatars/img_4756_3_avatar_03_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_04_60x60', 54, 'Teal Ghost',    '0', '/avatars/img_4756_3_avatar_04_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_05_60x60', 55, 'Ice Surge',     '0', '/avatars/img_4756_3_avatar_05_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_06_60x60', 56, 'Cryo Drift',    '0', '/avatars/img_4756_3_avatar_06_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_07_60x60', 57, 'Polar Storm',   '0', '/avatars/img_4756_3_avatar_07_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_08_60x60', 58, 'Aqua Phantom',  '0', '/avatars/img_4756_3_avatar_08_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_09_60x60', 59, 'Chill Strike',  '0', '/avatars/img_4756_3_avatar_09_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_10_60x60', 60, 'Cryo Pulse',    '0', '/avatars/img_4756_3_avatar_10_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_11_60x60', 61, 'Zenith Frost',  '0', '/avatars/img_4756_3_avatar_11_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),
('img_4756_3_avatar_12_60x60', 62, 'Blue Mirage',   '0', '/avatars/img_4756_3_avatar_12_60x60.png', '#020e14', '#00d4ff', '#0090b8', '#00d4ff80', true, true, 'both'),

-- Solar gold squad (img_4764_1) — levels 63-71
('img_4764_1_avatar_01_60x60', 63, 'Solar Crown',     '0', '/avatars/img_4764_1_avatar_01_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_02_60x60', 64, 'Golden Wraith',   '0', '/avatars/img_4764_1_avatar_02_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_03_60x60', 65, 'Amber Phantom',   '0', '/avatars/img_4764_1_avatar_03_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_04_60x60', 66, 'Gilded Storm',    '0', '/avatars/img_4764_1_avatar_04_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_05_60x60', 67, 'Radiant Edge',    '0', '/avatars/img_4764_1_avatar_05_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_06_60x60', 68, 'Aurelius Shade',  '0', '/avatars/img_4764_1_avatar_06_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_07_60x60', 69, 'Sunstone Ghost',  '0', '/avatars/img_4764_1_avatar_07_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_08_60x60', 70, 'Topaz Surge',     '0', '/avatars/img_4764_1_avatar_08_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both'),
('img_4764_1_avatar_09_60x60', 71, 'Dusk Knight',     '0', '/avatars/img_4764_1_avatar_09_60x60.png', '#120d00', '#facc15', '#b8900b', '#facc1590', true, true, 'both')

ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  image_src = EXCLUDED.image_src,
  bg        = EXCLUDED.bg,
  figure    = EXCLUDED.figure,
  ring      = EXCLUDED.ring,
  glow      = EXCLUDED.glow,
  is_new    = EXCLUDED.is_new,
  show_in   = EXCLUDED.show_in,
  updated_at = now();
