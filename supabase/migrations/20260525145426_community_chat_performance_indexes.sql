create index if not exists community_messages_community_created_idx
  on public.community_messages (community_id, created_at desc);

create index if not exists community_messages_reply_to_message_id_idx
  on public.community_messages (reply_to_message_id)
  where reply_to_message_id is not null;

create index if not exists community_members_user_idx
  on public.community_members (user_id);
