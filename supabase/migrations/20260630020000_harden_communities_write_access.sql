-- Harden communities table write access.
--
-- Problem: 20240009000000_communities_write_access.sql added open INSERT and
-- UPDATE policies for both anon and authenticated roles (USING true /
-- WITH CHECK true). This allows any client — including anonymous visitors —
-- to insert or modify community rows directly via PostgREST.
--
-- Fix:
--   1. Drop the permissive anon_write and anon_update policies.
--   2. Revoke INSERT, UPDATE, DELETE from anon entirely.
--   3. Restrict authenticated direct writes to admins only.
--      All legitimate community creation/update paths already go through
--      SECURITY DEFINER RPCs (submit_community_request, approve_community,
--      update_community_presentation) which run as service_role and are
--      unaffected by these policy changes.
--   4. Preserve SELECT for browsing (unchanged).

-- Drop the open policies from the original communities_write_access migration.
DROP POLICY IF EXISTS "anon_write"   ON public.communities;
DROP POLICY IF EXISTS "anon_update"  ON public.communities;

-- Also drop any pre-existing authenticated open-write policy if it exists.
DROP POLICY IF EXISTS "authenticated_write"  ON public.communities;
DROP POLICY IF EXISTS "authenticated_update" ON public.communities;

-- Revoke direct write privileges from anon.
REVOKE INSERT, UPDATE, DELETE ON public.communities FROM anon;

-- Authenticated direct writes are admin-only.
-- Normal users go through RPCs; this is a safety net for direct PostgREST calls.
DROP POLICY IF EXISTS "communities_admin_insert" ON public.communities;
DROP POLICY IF EXISTS "communities_admin_update" ON public.communities;
DROP POLICY IF EXISTS "communities_admin_delete" ON public.communities;

CREATE POLICY "communities_admin_insert"
  ON public.communities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "communities_admin_update"
  ON public.communities
  FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "communities_admin_delete"
  ON public.communities
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
