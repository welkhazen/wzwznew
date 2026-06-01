-- DANGER: wipes ALL user data, communities, messages, polls, accounts.
-- Run manually in Supabase SQL Editor. Not a migration.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'community_poll_votes',
    'community_polls',
    'community_messages',
    'community_requests',
    'community_waitlist',
    'community_members',
    'user_community_unlocks',
    'communities',
    'user_avatar_selection',
    'user_avatar_inventory',
    'user_subscriptions',
    'notification_consents',
    'issue_reports',
    'user_aliases',
    'user_xp_claims',
    'user_progress',
    'users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t);
    END IF;
  END LOOP;
END $$;
