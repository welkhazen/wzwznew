-- Notify a message's author when someone pins their message to a profile.

create table if not exists public.message_pin_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id text not null,
  actor_user_id text not null,
  actor_name text not null,
  message_id text not null,
  community_id text,
  community_title text,
  message_text text,
  created_at timestamptz not null default now()
);

create index if not exists message_pin_notifications_recipient_idx
  on public.message_pin_notifications (recipient_user_id, created_at desc);

alter table public.message_pin_notifications enable row level security;

grant select, insert on table public.message_pin_notifications to authenticated;

drop policy if exists "message_pin_notifications_select_own" on public.message_pin_notifications;
create policy "message_pin_notifications_select_own" on public.message_pin_notifications
  for select using (recipient_user_id = (public.current_user_id())::text);

drop policy if exists "message_pin_notifications_insert_own" on public.message_pin_notifications;
create policy "message_pin_notifications_insert_own" on public.message_pin_notifications
  for insert with check (actor_user_id = (public.current_user_id())::text);

create or replace function public.notify_message_pinned(
  p_recipient_user_id text,
  p_message_id text,
  p_community_id text default null,
  p_community_title text default null,
  p_message_text text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_actor_name text;
begin
  v_uid := public.current_user_id();
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  if p_recipient_user_id is null or p_recipient_user_id = v_uid::text then
    return;
  end if;

  select username into v_actor_name from public.users where id = v_uid;

  insert into public.message_pin_notifications (
    recipient_user_id, actor_user_id, actor_name, message_id, community_id, community_title, message_text
  ) values (
    p_recipient_user_id, v_uid::text, coalesce(v_actor_name, 'Someone'), p_message_id, p_community_id, p_community_title, p_message_text
  );
end;
$$;

revoke execute on function public.notify_message_pinned(text, text, text, text, text) from public;
grant execute on function public.notify_message_pinned(text, text, text, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
