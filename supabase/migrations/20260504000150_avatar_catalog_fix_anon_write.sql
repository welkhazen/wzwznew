-- Remove the anon write grant added by the previous migration.
-- Anonymous users (public browser with publishable key) can only read.
-- Writes require an authenticated session.

drop policy if exists avatar_catalog_write_anon on public.avatar_catalog;
