-- This app uses custom auth (not Supabase Auth), so auth.uid() is always null
-- for every request. RLS on avatar_catalog provides no meaningful security and
-- has been causing persistent HTTP 500 errors due to policy conflicts that
-- survive policy drops because PostgREST's schema cache is stale.
--
-- Disabling RLS is the correct call here: the table is publicly readable by
-- design, and write access is gated at the application layer (admin panel).

alter table public.avatar_catalog disable row level security;

notify pgrst, 'reload schema';
