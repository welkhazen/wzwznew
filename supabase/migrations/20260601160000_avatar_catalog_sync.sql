-- Sync avatar_catalog with the latest renames + new artwork.
-- Idempotent: only updates existing rows; inserts use ON CONFLICT DO NOTHING.

-- Rename Horned Iron -> Viozen and point at the new 5.png image.
UPDATE public.avatar_catalog
SET name = 'Viozen',
    image_src = '/avatars/5.png'
WHERE id = 'horned-iron';

-- Add Blu Fifer (level 20 in the reveal grid).
INSERT INTO public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, is_new)
VALUES ('blu-fifer', 20, 'Blu Fifer', '50', '/avatars/11.png', '#0a1a2e', '#3b82f6', '#60a5fa', '#3b82f680', true, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    image_src = EXCLUDED.image_src,
    bg = EXCLUDED.bg,
    figure = EXCLUDED.figure,
    ring = EXCLUDED.ring,
    glow = EXCLUDED.glow,
    is_active = EXCLUDED.is_active;

-- Ensure Golden Muse exists too (level 19 in the reveal grid).
INSERT INTO public.avatar_catalog (id, level, name, price, image_src, bg, figure, ring, glow, is_active, is_new)
VALUES ('golden-muse', 19, 'Golden Muse', '50', '/avatars/9.png', '#201604', '#facc15', '#facc15', '#facc1590', true, false)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    image_src = EXCLUDED.image_src,
    bg = EXCLUDED.bg,
    figure = EXCLUDED.figure,
    ring = EXCLUDED.ring,
    glow = EXCLUDED.glow,
    is_active = EXCLUDED.is_active;

NOTIFY pgrst, 'reload schema';
