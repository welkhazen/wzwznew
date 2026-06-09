-- Fix Black and Blue avatars so their bg/figure/ring/glow match their names.
-- Previously Black was red themed and Blue was yellow themed.

UPDATE public.avatar_catalog
SET bg = '#0a0a0a', figure = '#cbd5e1', ring = '#cbd5e1', glow = '#cbd5e180',
    image_src = '/avatars/avatar-9.svg'
WHERE id = 'black';

UPDATE public.avatar_catalog
SET bg = '#0a1424', figure = '#3b82f6', ring = '#3b82f6', glow = '#3b82f680',
    image_src = '/avatars/avatar-10.svg'
WHERE id = 'blue';

NOTIFY pgrst, 'reload schema';
