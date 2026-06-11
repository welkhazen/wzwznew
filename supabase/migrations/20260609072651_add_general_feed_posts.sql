create table if not exists public.general_feed_posts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_name text not null,
  sender_avatar_level integer,
  text text not null check (length(btrim(text)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists general_feed_posts_created_at_idx
  on public.general_feed_posts (created_at desc);

alter table public.general_feed_posts enable row level security;

revoke all on public.general_feed_posts from anon, authenticated;
grant select on public.general_feed_posts to anon, authenticated;

drop policy if exists "general_feed_posts_read_public" on public.general_feed_posts;
create policy "general_feed_posts_read_public"
on public.general_feed_posts
for select
to anon, authenticated
using (true);

create or replace function public.send_general_feed_post(p_text text)
returns public.general_feed_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_user public.users%rowtype;
  v_clean_text text;
  v_row public.general_feed_posts;
begin
  v_uid := public.current_user_id();
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  select * into v_user from public.users where id = v_uid;
  if not found or v_user.status = 'banned' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_clean_text := btrim(coalesce(p_text, ''));
  if length(v_clean_text) = 0 or length(v_clean_text) > 500 then
    raise exception 'invalid_text_length' using errcode = '22023';
  end if;

  insert into public.general_feed_posts (
    sender_id,
    sender_name,
    sender_avatar_level,
    text
  ) values (
    v_uid,
    v_user.username,
    v_user.avatar_level,
    v_clean_text
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.send_general_feed_post(text) from public;
grant execute on function public.send_general_feed_post(text) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'general_feed_posts'
     ) then
    alter publication supabase_realtime add table public.general_feed_posts;
  end if;
end $$;
