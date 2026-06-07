-- Strip the eligibility gate from claim_early_signup_avatar — the reward
-- is now open to every user during onboarding, capped at one per account
-- via the existing idempotency check + early_signup_avatar_id column.

create or replace function public.claim_early_signup_avatar(p_user_id text, p_avatar_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_existing text;
begin
  if not exists (select 1 from public.avatar_catalog where id = p_avatar_id and is_active = true) then
    return jsonb_build_object('ok', false, 'error', 'unknown_avatar');
  end if;

  select early_signup_avatar_id into v_existing
  from public.users
  where id::text = p_user_id;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'avatar_id', v_existing, 'already_claimed', true);
  end if;

  update public.users
  set early_signup_avatar_id = p_avatar_id,
      early_signup_avatar_claimed = true
  where id::text = p_user_id;

  insert into public.user_avatar_inventory (user_id, avatar_id)
  values (p_user_id, p_avatar_id)
  on conflict (user_id, avatar_id) do nothing;

  return jsonb_build_object('ok', true, 'avatar_id', p_avatar_id, 'already_claimed', false);
end;
$$;

grant execute on function public.claim_early_signup_avatar(text, text) to anon, authenticated;
