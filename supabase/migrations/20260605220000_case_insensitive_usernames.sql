-- Make username lookups case-insensitive so "ahmad" and "Ahmad" are the same user.

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON public.users (lower(username));

CREATE OR REPLACE FUNCTION public.create_user_with_password(p_username text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid := gen_random_uuid();
begin
  if exists (select 1 from public.users where lower(username) = lower(p_username)) then
    raise exception 'username_taken' using errcode = '23505';
  end if;
  insert into public.users (id, username, password_hash)
  values (v_id, p_username, extensions.crypt(p_password, extensions.gen_salt('bf', 6)));
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.verify_user_password(p_username text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid;
begin
  select id into v_id
  from public.users
  where lower(username) = lower(p_username)
    and password_hash is not null
    and password_hash like '$2%'
    and password_hash = extensions.crypt(p_password, password_hash)
    and status not in ('banned', 'deleted')
  limit 1;
  return v_id;
end;
$function$;
