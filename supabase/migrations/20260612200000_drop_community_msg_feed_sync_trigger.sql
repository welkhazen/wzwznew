-- Remove trigger that was cross-posting every community chat message into
-- general_feed_posts. Community chat and the general feed are separate surfaces;
-- only explicit posts via send_general_feed_post should appear in the feed.

drop trigger if exists trg_community_msg_to_general_feed on public.community_messages;
drop function if exists public.sync_community_msg_to_general_feed();
