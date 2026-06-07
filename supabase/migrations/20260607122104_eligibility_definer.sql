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

grant execute on function public.is_early_signup_eligible(text) to anon, authenticated;
