-- Remove the Golden Muse avatar catalog row. Its image_src '/avatars/9.png'
-- never had a matching asset shipped in public/avatars/, so every shop render
-- emitted a 404. Drop the row until a real asset is added; the earlier
-- 20260601160000_avatar_catalog_sync.sql migration re-inserts it otherwise.
DELETE FROM public.avatar_catalog WHERE id = 'golden-muse';
