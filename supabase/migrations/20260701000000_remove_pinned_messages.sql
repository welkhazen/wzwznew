-- Remove the deprecated chat-message pinning feature from deployed databases.

drop function if exists public.notify_message_pinned(text, text, text, text, text);
drop table if exists public.message_pin_notifications cascade;
drop table if exists public.user_pinned_message cascade;

alter table if exists public.community_messages
  drop column if exists pinned;

notify pgrst, 'reload schema';
