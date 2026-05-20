-- Ensure the local-auth admin profile starts at level 3 in Supabase-backed XP.
-- Previous seed migration was marked applied during remote history repair before it ran.
insert into public.user_progress (user_id, xp, level, total_polls_answered, streak_days)
values (
  '00000000-0000-0000-0000-000000000001',
  1500,
  public.calculate_level(1500),
  20,
  3
)
on conflict (user_id) do update
set
  xp = greatest(public.user_progress.xp, excluded.xp),
  level = public.calculate_level(greatest(public.user_progress.xp, excluded.xp)),
  total_polls_answered = greatest(public.user_progress.total_polls_answered, excluded.total_polls_answered),
  streak_days = greatest(public.user_progress.streak_days, excluded.streak_days),
  updated_at = now();
