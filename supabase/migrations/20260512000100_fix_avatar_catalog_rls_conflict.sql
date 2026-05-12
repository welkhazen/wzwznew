-- The combination of a FOR SELECT policy AND a FOR ALL policy on the same
-- role causes PostgREST to return HTTP 500 on every anon SELECT.
-- Authenticated users (admin) are unaffected because they only hit the
-- FOR ALL policy; anonymous users hit both, triggering the bug.
--
-- Fix: drop all SELECT-only policies on avatar_catalog (both possible names
-- used across migration history) and keep only the FOR ALL policy.
-- The app-level `.eq("is_active", true)` filter handles visibility.

drop policy if exists avatar_catalog_read     on public.avatar_catalog;
drop policy if exists avatar_catalog_read_all on public.avatar_catalog;

-- Ensure the catch-all policy exists (idempotent).
drop policy if exists avatar_catalog_write on public.avatar_catalog;
create policy avatar_catalog_write
  on public.avatar_catalog for all
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
