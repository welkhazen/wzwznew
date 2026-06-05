-- Update avatar catalog image paths to use the optimised landing thumbnails.
-- Old paths (/avatars/18.png, /avatars/23.png, etc.) no longer exist.

UPDATE public.avatar_catalog SET image_src = '/avatars/landing/neon-lynx.webp'   WHERE id = 'neon-lynx'   AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
UPDATE public.avatar_catalog SET image_src = '/avatars/landing/blue-signal.webp' WHERE id = 'blue-signal' AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
UPDATE public.avatar_catalog SET image_src = '/avatars/landing/violet-mask.webp' WHERE id = 'violet-mask' AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
UPDATE public.avatar_catalog SET image_src = '/avatars/landing/viozen.webp'      WHERE id = 'viozen'      AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
UPDATE public.avatar_catalog SET image_src = '/avatars/landing/solar-flame.webp' WHERE id = 'solar-flame' AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
UPDATE public.avatar_catalog SET image_src = '/avatars/landing/pink-circuit.webp'WHERE id = 'pink-circuit' AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
UPDATE public.avatar_catalog SET image_src = '/avatars/landing/blu-fifer.webp'   WHERE id = 'blu-fifer'   AND (image_src IS NULL OR image_src NOT LIKE '%/landing/%');
