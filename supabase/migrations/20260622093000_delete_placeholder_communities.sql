-- Remove placeholder waitlist communities that should not appear in the dashboard.
-- Deleting from communities cascades to members, messages, waitlist, and polls.

DELETE FROM public.user_community_unlocks
WHERE community_id IN ('c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12');

DELETE FROM public.user_favorite_communities
WHERE community_id IN ('c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12');

DELETE FROM public.user_pinned_message
WHERE community_id IN ('c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12');

DELETE FROM public.chat_reports
WHERE community_id IN ('c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12');

DELETE FROM public.communities
WHERE id IN ('c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12');
