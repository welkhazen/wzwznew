-- Harden RLS on user-owned tables.
--
-- Problem: user_favorite_communities and
-- user_accent_unlocks have USING (true) / WITH CHECK (true) policies and
-- GRANT ALL TO anon, authenticated. Any authenticated (or anonymous) user can
-- read or write any other user's rows by supplying an arbitrary user_id.
--
-- Fix:
--   1. Revoke INSERT/UPDATE/DELETE from anon entirely.
--   2. Replace permissive authenticated policies with owner-scoped ones that
--      check public.current_user_id()::text = user_id.
--   3. SELECT remains open (reads are not sensitive; favorites are
--      visible to community members anyway).
--
-- Auth note: current_user_id() returns auth.uid(). Writes will fail for
-- users without an active Supabase Auth session — this is intentional and
-- correct; all write paths already require authentication.

-- ─── user_favorite_communities ────────────────────────────────────────────

REVOKE INSERT, UPDATE, DELETE ON public.user_favorite_communities FROM anon;

DROP POLICY IF EXISTS "user_favorite_communities_insert"    ON public.user_favorite_communities;
DROP POLICY IF EXISTS "user_favorite_communities_update"    ON public.user_favorite_communities;
DROP POLICY IF EXISTS "user_favorite_communities_delete"    ON public.user_favorite_communities;

-- Only the owning user may insert/update/delete their own rows.
CREATE POLICY "user_favorite_communities_insert_own"
  ON public.user_favorite_communities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_user_id()::text);

CREATE POLICY "user_favorite_communities_update_own"
  ON public.user_favorite_communities
  FOR UPDATE
  TO authenticated
  USING  (user_id = public.current_user_id()::text)
  WITH CHECK (user_id = public.current_user_id()::text);

CREATE POLICY "user_favorite_communities_delete_own"
  ON public.user_favorite_communities
  FOR DELETE
  TO authenticated
  USING (user_id = public.current_user_id()::text);

-- ─── user_accent_unlocks ──────────────────────────────────────────────────

REVOKE INSERT, UPDATE, DELETE ON public.user_accent_unlocks FROM anon;

DROP POLICY IF EXISTS "user_accent_unlocks_insert_own"  ON public.user_accent_unlocks;
DROP POLICY IF EXISTS "user_accent_unlocks_delete_own"  ON public.user_accent_unlocks;

CREATE POLICY "user_accent_unlocks_insert_own"
  ON public.user_accent_unlocks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_user_id()::text);

CREATE POLICY "user_accent_unlocks_delete_own"
  ON public.user_accent_unlocks
  FOR DELETE
  TO authenticated
  USING (user_id = public.current_user_id()::text);

NOTIFY pgrst, 'reload schema';
