-- Allow authenticated users to write to avatar_catalog.
-- Anon (public browser) callers can only read; writes require a session.

drop policy if exists avatar_catalog_write_admin_only on public.avatar_catalog;
drop policy if exists avatar_catalog_write_anon on public.avatar_catalog;

create policy avatar_catalog_write_authenticated on public.avatar_catalog
for all to authenticated
using (true)
with check (true);
