-- Seed admin user with starting XP so they begin at a visible level.
-- Admin user ID is hardcoded in authController.ts local auth.
-- ON CONFLICT ... DO NOTHING means this won't overwrite XP earned after first deploy.
INSERT INTO public.user_progress (user_id, xp, level, total_polls_answered, streak_days)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  1000,
  2,
  20,
  3
)
ON CONFLICT (user_id) DO NOTHING;
