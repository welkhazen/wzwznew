-- 1. Inventory: add `source` column and ensure unique (user_id, avatar_id).
alter table public.user_avatar_inventory
  add column if not exists source text not null default 'purchase';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_avatar_inventory_source_check'
  ) then
    alter table public.user_avatar_inventory
      add constraint user_avatar_inventory_source_check
      check (source in ('default','early_signup_reward','spin_reward','purchase','admin_reward'));
  end if;
end$$;

-- (user_id, avatar_id) is already the primary key, so we have the unique guarantee.

-- 2. avatar_catalog: add frame_color + rank_tier columns.
alter table public.avatar_catalog
  add column if not exists frame_color text,
  add column if not exists rank_tier integer;

-- 3. Backfill frame_color from existing data where possible.
-- Heuristic: derive from name / id / figure color.
update public.avatar_catalog set frame_color = 'grey'     where frame_color is null and (lower(name) like '%grey%' or lower(name) like '%gray%' or lower(name) like '%silver%' or lower(name) like '%steel%' or lower(name) like '%chrome%' or lower(name) like '%ivory%' or lower(name) like '%white mirage%');
update public.avatar_catalog set frame_color = 'blue'     where frame_color is null and (lower(name) like '%blue%' or lower(name) like '%cyan%' or lower(name) like '%azure%' or lower(name) like '%teal%' or lower(name) like '%frost%' or lower(name) like '%indigo%');
update public.avatar_catalog set frame_color = 'purple'   where frame_color is null and (lower(name) like '%purple%' or lower(name) like '%violet%' or lower(name) like '%amethyst%');
update public.avatar_catalog set frame_color = 'orange'   where frame_color is null and (lower(name) like '%orange%' or lower(name) like '%ember%' or lower(name) like '%bronze%' or lower(name) like '%copper%' or lower(name) like '%amber%');
update public.avatar_catalog set frame_color = 'red'      where frame_color is null and (lower(name) like '%red%' or lower(name) like '%crimson%' or lower(name) like '%ruby%' or lower(name) like '%scarlet%' or lower(name) like '%blood%' or lower(name) like '%horned%');
update public.avatar_catalog set frame_color = 'pink'     where frame_color is null and (lower(name) like '%pink%' or lower(name) like '%rose%' or lower(name) like '%magenta%' or lower(name) like '%fuchsia%');
update public.avatar_catalog set frame_color = 'gold'     where frame_color is null and (lower(name) like '%gold%' or lower(name) like '%yellow%' or lower(name) like '%pharaoh%' or lower(name) like '%solar%' or lower(name) like '%sun%');
update public.avatar_catalog set frame_color = 'platinum' where frame_color is null and (lower(name) like '%platinum%' or lower(name) like '%diamond%');
update public.avatar_catalog set frame_color = 'white'    where frame_color is null and (lower(name) like '%white%' or lower(name) like '%snow%' or lower(name) like '%glass%');
update public.avatar_catalog set frame_color = 'rainbow'  where frame_color is null and (lower(name) like '%rainbow%' or lower(name) like '%prism%' or lower(name) like '%spectrum%');
-- Fallback for everything else.
update public.avatar_catalog set frame_color = 'grey' where frame_color is null;

-- Derive rank_tier from frame_color where it isn't set yet.
update public.avatar_catalog set rank_tier = case lower(coalesce(frame_color, 'grey'))
  when 'grey'     then 1
  when 'gray'     then 1
  when 'blue'     then 2
  when 'purple'   then 3
  when 'orange'   then 4
  when 'red'      then 5
  when 'pink'     then 6
  when 'gold'     then 7
  when 'platinum' then 8
  when 'white'    then 9
  when 'rainbow'  then 10
  else 1
end where rank_tier is null;

-- 4. Update claim RPCs to record `source` on insert (idempotent: existing rows
-- keep their current source).
create or replace function public.claim_free_spin_avatar(p_user_id text, p_avatar_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare v_existing text;
begin
  if not exists (select 1 from public.avatar_catalog where id = p_avatar_id and is_active = true) then
    return jsonb_build_object('ok', false, 'error', 'unknown_avatar');
  end if;
  select free_spin_avatar_id into v_existing from public.users where id::text = p_user_id;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'avatar_id', v_existing, 'already_claimed', true);
  end if;
  update public.users set free_spin_avatar_id = p_avatar_id, free_spin_avatar_claimed = true where id::text = p_user_id;
  insert into public.user_avatar_inventory (user_id, avatar_id, source)
    values (p_user_id, p_avatar_id, 'spin_reward')
    on conflict (user_id, avatar_id) do nothing;
  return jsonb_build_object('ok', true, 'avatar_id', p_avatar_id, 'already_claimed', false);
end;
$function$;

create or replace function public.claim_early_signup_avatar(p_user_id text, p_avatar_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare v_existing text;
begin
  if not exists (select 1 from public.avatar_catalog where id = p_avatar_id and is_active = true) then
    return jsonb_build_object('ok', false, 'error', 'unknown_avatar');
  end if;
  select early_signup_avatar_id into v_existing from public.users where id::text = p_user_id;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'avatar_id', v_existing, 'already_claimed', true);
  end if;
  update public.users set early_signup_avatar_id = p_avatar_id, early_signup_avatar_claimed = true where id::text = p_user_id;
  insert into public.user_avatar_inventory (user_id, avatar_id, source)
    values (p_user_id, p_avatar_id, 'early_signup_reward')
    on conflict (user_id, avatar_id) do nothing;
  return jsonb_build_object('ok', true, 'avatar_id', p_avatar_id, 'already_claimed', false);
end;
$function$;

revoke execute on function public.claim_free_spin_avatar(text, text) from public;
grant execute on function public.claim_free_spin_avatar(text, text) to authenticated, service_role;
revoke execute on function public.claim_early_signup_avatar(text, text) from public;
grant execute on function public.claim_early_signup_avatar(text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
