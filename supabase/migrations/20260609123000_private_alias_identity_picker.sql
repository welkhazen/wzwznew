create or replace function public.save_private_alias(p_alias text)
returns public.user_aliases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_alias text;
  v_row public.user_aliases;
begin
  v_uid := public.current_user_id();
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  v_alias := btrim(coalesce(p_alias, ''));
  if v_alias !~ '^[A-Za-z0-9._-]{3,24}$' then
    raise exception 'invalid_private_username' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.users
    where lower(username) = lower(v_alias)
      and id <> v_uid
  ) or exists (
    select 1
    from public.user_aliases
    where lower(alias) = lower(v_alias)
      and user_id <> v_uid
  ) then
    raise exception 'private_username_taken' using errcode = '23505';
  end if;

  insert into public.user_aliases (user_id, alias, is_public)
  values (v_uid, v_alias, false)
  on conflict (user_id) where is_public = false
  do update set alias = excluded.alias, updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.save_private_alias(text) from public;
grant execute on function public.save_private_alias(text) to authenticated, service_role;

drop function if exists public.send_community_message(text, text, uuid);

create or replace function public.send_community_message(
  p_community_id text,
  p_text text,
  p_reply_to_message_id uuid default null,
  p_identity_alias text default null
)
returns public.community_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_user public.users%rowtype;
  v_is_member boolean;
  v_clean_text text;
  v_reply_sender text;
  v_reply_text text;
  v_sender_name text;
  v_row public.community_messages;
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
  if length(v_clean_text) = 0 or length(v_clean_text) > 2000 then
    raise exception 'invalid_text_length' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.community_members
     where community_id = p_community_id
       and user_id = v_uid::text
  ) into v_is_member;

  if not v_is_member and not public.is_admin() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  v_sender_name := v_user.username;
  if nullif(btrim(coalesce(p_identity_alias, '')), '') is not null then
    select alias
      into v_sender_name
      from public.user_aliases
     where user_id = v_uid
       and is_public = false
       and lower(alias) = lower(btrim(p_identity_alias))
     limit 1;

    if v_sender_name is null then
      raise exception 'invalid_identity_alias' using errcode = '42501';
    end if;
  end if;

  if p_reply_to_message_id is not null then
    select sender_name, text
      into v_reply_sender, v_reply_text
      from public.community_messages
     where id = p_reply_to_message_id
       and community_id = p_community_id;
  end if;

  insert into public.community_messages (
    community_id, sender_id, sender_name, sender_avatar_level,
    text, reply_to_message_id, reply_to_sender_name, reply_to_text
  ) values (
    p_community_id,
    v_uid::text,
    v_sender_name,
    v_user.avatar_level,
    v_clean_text,
    p_reply_to_message_id,
    v_reply_sender,
    v_reply_text
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.send_community_message(text, text, uuid, text) from public;
grant execute on function public.send_community_message(text, text, uuid, text) to authenticated, service_role;

notify pgrst, 'reload schema';
