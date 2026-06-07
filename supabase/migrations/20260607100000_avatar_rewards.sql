-- Avatar reward system: spin + early-signup claims.
-- A user can own at most one spin avatar and one early-signup avatar.

alter table public.users
  add column if not exists free_spin_avatar_claimed boolean not null default false,
  add column if not exists free_spin_avatar_id text,
  add column if not exists early_signup_avatar_claimed boolean not null default false,
  add column if not exists early_signup_avatar_id text;

-- Cutoff for "early signup" eligibility — must match src/config/avatarConfig.ts.
-- Function so we can change the cutoff in one place without a redeploy.
create or replace function public.early_signup_cutoff()
returns timestamptz
language sql
immutable
as $$
  select '2026-06-07T00:00:00Z'::timestamptz
$$;

-- Eligibility check used by the RPC and (read-only) by the client.
-- SECURITY DEFINER so users.row lookups aren't blocked by RLS. The
-- function only returns a boolean, no data leak.
create or replace function public.is_early_signup_eligible(p_user_id text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.users
    where id::text = p_user_id
      and coalesce(created_at, now()) < public.early_signup_cutoff()
      and coalesce(early_signup_avatar_claimed, false) = false
  );
$$;

-- One-shot claim. Idempotent: re-calling with the same avatar_id is a no-op;
-- calling with a different avatar after the user already claimed errors out.
create or replace function public.claim_early_signup_avatar(p_user_id text, p_avatar_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_eligible boolean;
  v_existing text;
begin
  -- Must be a real avatar in the catalog.
  if not exists (select 1 from public.avatar_catalog where id = p_avatar_id and is_active = true) then
    return jsonb_build_object('ok', false, 'error', 'unknown_avatar');
  end if;

  -- Already claimed? Return their previous pick (idempotent).
  select early_signup_avatar_id into v_existing
  from public.users
  where id::text = p_user_id;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'avatar_id', v_existing, 'already_claimed', true);
  end if;

  select public.is_early_signup_eligible(p_user_id) into v_eligible;
  if not v_eligible then
    return jsonb_build_object('ok', false, 'error', 'not_eligible');
  end if;

  update public.users
  set early_signup_avatar_id = p_avatar_id,
      early_signup_avatar_claimed = true
  where id::text = p_user_id;

  -- Also drop the avatar into the inventory so the rest of the app sees it.
  insert into public.user_avatar_inventory (user_id, avatar_id)
  values (p_user_id, p_avatar_id)
  on conflict (user_id, avatar_id) do nothing;

  return jsonb_build_object('ok', true, 'avatar_id', p_avatar_id, 'already_claimed', false);
end;
$$;

-- Persist a spin result, also one-shot per user. Same idempotency contract.
create or replace function public.claim_free_spin_avatar(p_user_id text, p_avatar_id text)
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

  select free_spin_avatar_id into v_existing
  from public.users
  where id::text = p_user_id;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'avatar_id', v_existing, 'already_claimed', true);
  end if;

  update public.users
  set free_spin_avatar_id = p_avatar_id,
      free_spin_avatar_claimed = true
  where id::text = p_user_id;

  insert into public.user_avatar_inventory (user_id, avatar_id)
  values (p_user_id, p_avatar_id)
  on conflict (user_id, avatar_id) do nothing;

  return jsonb_build_object('ok', true, 'avatar_id', p_avatar_id, 'already_claimed', false);
end;
$$;

grant execute on function public.early_signup_cutoff()                                     to anon, authenticated;
grant execute on function public.is_early_signup_eligible(text)                            to anon, authenticated;
grant execute on function public.claim_early_signup_avatar(text, text)                     to anon, authenticated;
grant execute on function public.claim_free_spin_avatar(text, text)                        to anon, authenticated;
