-- Let general feed posts made from within a community page carry that
-- community's attribution, same as posts cross-posted from community chat.

drop function if exists public.send_general_feed_post(text);

create or replace function public.send_general_feed_post(
  p_text text,
  p_community_id text default null
)
returns public.general_feed_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_user public.users%rowtype;
  v_clean_text text;
  v_community_name text;
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

  if p_community_id is not null then
    select title into v_community_name from public.communities where id = p_community_id;
  end if;

  insert into public.general_feed_posts (
    sender_id,
    sender_name,
    sender_avatar_level,
    text,
    community_id,
    community_name
  ) values (
    v_uid,
    v_user.username,
    v_user.avatar_level,
    v_clean_text,
    case when v_community_name is not null then p_community_id else null end,
    v_community_name
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.send_general_feed_post(text, text) from public;
grant execute on function public.send_general_feed_post(text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
