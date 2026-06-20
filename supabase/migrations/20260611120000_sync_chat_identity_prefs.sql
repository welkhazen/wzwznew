-- Persist each user's chat-identity selection (which name they post under) and
-- their private-identity avatar level, so both follow the account across
-- devices instead of living only in browser localStorage.

alter table public.users
  add column if not exists chat_identity_alias text,
  add column if not exists chat_avatar_level integer;

-- Column-level grants on public.users are explicit (see the harden-RLS
-- migration), so the browser client can only read columns named here.
grant select (chat_identity_alias, chat_avatar_level) on public.users to authenticated;

create or replace function public.set_chat_identity(
  p_alias text default null,
  p_avatar_level integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_alias text;
begin
  v_uid := public.current_user_id();
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  v_alias := nullif(btrim(coalesce(p_alias, '')), '');

  -- A non-null selection must be one of the caller's own private aliases,
  -- matching the integrity check in send_community_message.
  if v_alias is not null and not exists (
    select 1
      from public.user_aliases
     where user_id = v_uid
       and is_public = false
       and lower(alias) = lower(v_alias)
  ) then
    raise exception 'invalid_identity_alias' using errcode = '42501';
  end if;

  update public.users
     set chat_identity_alias = v_alias,
         chat_avatar_level = case
           when p_avatar_level between 1 and 100 then p_avatar_level
           else chat_avatar_level
         end
   where id = v_uid;
end;
$$;

revoke execute on function public.set_chat_identity(text, integer) from public;
grant execute on function public.set_chat_identity(text, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
