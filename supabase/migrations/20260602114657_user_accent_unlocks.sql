-- Persist accent (theme color) unlocks per user so they survive logout/login
-- and follow the account across devices.

create table if not exists public.user_accent_unlocks (
  user_id text not null,
  accent_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, accent_id)
);

alter table public.user_accent_unlocks enable row level security;

grant usage on schema public to anon, authenticated;
grant all on table public.user_accent_unlocks to anon, authenticated;

drop policy if exists "user_accent_unlocks_select_own" on public.user_accent_unlocks;
create policy "user_accent_unlocks_select_own" on public.user_accent_unlocks
  for select using (true);

drop policy if exists "user_accent_unlocks_insert_own" on public.user_accent_unlocks;
create policy "user_accent_unlocks_insert_own" on public.user_accent_unlocks
  for insert with check (true);

drop policy if exists "user_accent_unlocks_delete_own" on public.user_accent_unlocks;
create policy "user_accent_unlocks_delete_own" on public.user_accent_unlocks
  for delete using (true);

notify pgrst, 'reload schema';
