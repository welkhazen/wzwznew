-- Fix 1: Ensure poll_comments table exists (idempotent re-apply)
create table if not exists poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references polls(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz default now()
);

alter table poll_comments enable row level security;

drop policy if exists "Public read" on poll_comments;
drop policy if exists "Public insert" on poll_comments;

create policy "Public read" on poll_comments for select to anon, authenticated using (true);
create policy "Public insert" on poll_comments for insert to anon, authenticated with check (true);

create index if not exists poll_comments_poll_id_idx on poll_comments(poll_id, created_at desc);

-- Fix 2: Open avatar_selection and avatar_inventory to anon.
-- The app uses custom auth (not Supabase Auth), so auth.uid() is always null
-- and the authenticated-only policies block every request.

drop policy if exists avatar_selection_read_own on public.user_avatar_selection;
drop policy if exists avatar_selection_upsert_own on public.user_avatar_selection;

create policy avatar_selection_read_anon on public.user_avatar_selection
  for select to anon, authenticated using (true);

create policy avatar_selection_write_anon on public.user_avatar_selection
  for all to anon, authenticated
  using (true)
  with check (true);

drop policy if exists avatar_inventory_read_own on public.user_avatar_inventory;
drop policy if exists avatar_inventory_insert_own on public.user_avatar_inventory;
drop policy if exists avatar_inventory_delete_own on public.user_avatar_inventory;

create policy avatar_inventory_read_anon on public.user_avatar_inventory
  for select to anon, authenticated using (true);

create policy avatar_inventory_write_anon on public.user_avatar_inventory
  for all to anon, authenticated
  using (true)
  with check (true);
