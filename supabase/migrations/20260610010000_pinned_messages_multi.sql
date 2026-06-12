-- Allow up to 7 pinned messages per user (was 1).
-- Switch user_pinned_message from a single-row-per-user table
-- (primary key user_id) to a multi-row table (primary key user_id, message_id).

drop table if exists public.user_pinned_message cascade;

create table if not exists public.user_pinned_message (
  user_id text not null,
  message_id text not null,
  community_id text not null,
  community_title text,
  sender_name text,
  message_text text not null,
  message_created_at timestamptz,
  pinned_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

alter table public.user_pinned_message enable row level security;

grant all on table public.user_pinned_message to anon, authenticated;

drop policy if exists "user_pinned_message_select_all" on public.user_pinned_message;
create policy "user_pinned_message_select_all" on public.user_pinned_message
  for select using (true);

drop policy if exists "user_pinned_message_insert" on public.user_pinned_message;
create policy "user_pinned_message_insert" on public.user_pinned_message
  for insert with check (true);

drop policy if exists "user_pinned_message_update" on public.user_pinned_message;
create policy "user_pinned_message_update" on public.user_pinned_message
  for update using (true) with check (true);

drop policy if exists "user_pinned_message_delete" on public.user_pinned_message;
create policy "user_pinned_message_delete" on public.user_pinned_message
  for delete using (true);

notify pgrst, 'reload schema';
