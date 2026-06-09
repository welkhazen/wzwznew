with ranked_private_aliases as (
  select
    id,
    row_number() over (partition by user_id order by created_at asc, id asc) as private_rank
  from public.user_aliases
  where is_public = false
)
delete from public.user_aliases alias
using ranked_private_aliases ranked
where alias.id = ranked.id
  and ranked.private_rank > 1;

create unique index if not exists user_aliases_one_private_per_user
  on public.user_aliases (user_id)
  where is_public = false;

create or replace function public.save_onboarding_identities(
  p_public_username text,
  p_private_alias text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_public text;
  v_private text;
begin
  v_uid := public.current_user_id();
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  v_public := btrim(coalesce(p_public_username, ''));
  v_private := btrim(coalesce(p_private_alias, ''));

  if v_public !~ '^[A-Za-z0-9._-]{3,24}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_public_username');
  end if;

  if v_private !~ '^[A-Za-z0-9._-]{3,24}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_private_username');
  end if;

  if exists (
    select 1
    from public.users
    where lower(username) = lower(v_public)
      and id <> v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'public_username_taken');
  end if;

  if exists (
    select 1
    from public.user_aliases
    where lower(alias) = lower(v_private)
      and user_id <> v_uid::text
  ) or exists (
    select 1
    from public.users
    where lower(username) = lower(v_private)
      and id <> v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'private_username_taken');
  end if;

  update public.users
  set username = v_public
  where id = v_uid;

  insert into public.user_aliases (user_id, alias, is_public)
  values (v_uid::text, v_private, false)
  on conflict (user_id) where is_public = false
  do update set alias = excluded.alias, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.save_onboarding_identities(text, text) from public;
grant execute on function public.save_onboarding_identities(text, text) to authenticated, service_role;
