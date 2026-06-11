-- Harden the highest-risk public Data API surfaces without changing the
-- existing app screens. Broader chat/community ownership RLS needs a server
-- auth migration because the current browser client still uses custom user IDs.

-- The users table contains password_hash and token_balance. Do not expose all
-- columns or public updates through the Data API.
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;

REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT (
  id,
  username,
  role,
  status,
  warnings,
  avatar_level,
  created_at,
  onboarding_completed,
  profile_public
) ON public.users TO anon, authenticated;
GRANT UPDATE (
  avatar_level,
  onboarding_completed,
  profile_public
) ON public.users TO anon, authenticated;

CREATE POLICY "users_public_profile_read"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "users_limited_public_update"
ON public.users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Community unlocks/subscriptions decide paid access. They must not be freely
-- writable from the browser.
DROP POLICY IF EXISTS "unlocks_all" ON public.user_community_unlocks;
DROP POLICY IF EXISTS "subscriptions_all" ON public.user_subscriptions;

REVOKE INSERT, UPDATE, DELETE ON public.user_community_unlocks FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_subscriptions FROM anon, authenticated;

CREATE POLICY "unlocks_public_read"
ON public.user_community_unlocks
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "subscriptions_public_read"
ON public.user_subscriptions
FOR SELECT
TO anon, authenticated
USING (true);

NOTIFY pgrst, 'reload schema';
