-- Hide messages that are held for review, blocked, removed, or soft-deleted
-- from everyone except the sender and admins/moderators.
--
-- RESTRICTIVE policies AND with existing permissive policies, so this narrows
-- the existing "public_read" policy on community_messages without replacing it.

DROP POLICY IF EXISTS "community_messages_hide_moderated" ON public.community_messages;
CREATE POLICY "community_messages_hide_moderated"
ON public.community_messages
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (
  (COALESCE(moderation_status, 'ok') IN ('ok', 'warn') AND COALESCE(is_deleted, false) = false)
  OR sender_id = public.current_user_id()::text
  OR public.is_admin()
);
