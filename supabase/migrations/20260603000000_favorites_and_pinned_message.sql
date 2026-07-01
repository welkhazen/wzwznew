-- User favorite communities (max 3).
-- Follows the same access pattern as user_accent_unlocks: permissive RLS,
-- auth enforced at the application layer, text user_id.
-- Drop any pre-existing versions of these tables so we land on the right
-- column types (text, not uuid) without leaving stale FK constraints behind.

drop table if exists public.user_favorite_communities cascade;

create table if not exists public.user_favorite_communities (
  user_id text not null,
  community_id text not null,
  position smallint not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, community_id),
  unique (user_id, position)
);

alter table public.user_favorite_communities enable row level security;

grant usage on schema public to anon, authenticated;
grant all on table public.user_favorite_communities to anon, authenticated;

drop policy if exists "user_favorite_communities_select_all" on public.user_favorite_communities;
create policy "user_favorite_communities_select_all" on public.user_favorite_communities
  for select using (true);

drop policy if exists "user_favorite_communities_insert" on public.user_favorite_communities;
create policy "user_favorite_communities_insert" on public.user_favorite_communities
  for insert with check (true);

drop policy if exists "user_favorite_communities_update" on public.user_favorite_communities;
create policy "user_favorite_communities_update" on public.user_favorite_communities
  for update using (true) with check (true);

drop policy if exists "user_favorite_communities_delete" on public.user_favorite_communities;
create policy "user_favorite_communities_delete" on public.user_favorite_communities
  for delete using (true);

notify pgrst, 'reload schema';
