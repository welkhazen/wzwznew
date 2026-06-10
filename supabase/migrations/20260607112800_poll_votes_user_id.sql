-- public.get_profile_stats references poll_votes.user_id, but poll_votes
-- (defined in 20240002100000_create_users_table.sql / 20260511000100_poll_votes_anon_access.sql)
-- never had this column, breaking fresh migration replays (preview branches).
ALTER TABLE public.poll_votes
  ADD COLUMN IF NOT EXISTS user_id text;
