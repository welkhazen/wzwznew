-- Permanently delete existing chat history for Late Night Talk.
delete from public.community_messages
where community_id = 'lnt';
