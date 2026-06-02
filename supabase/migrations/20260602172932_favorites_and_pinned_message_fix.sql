-- History-alignment migration.
--
-- The remote project recorded a "favorites_and_pinned_message_fix"
-- migration when it was first applied via the Supabase MCP. The actual
-- DDL lives in 20260603000000_favorites_and_pinned_message.sql, which
-- runs after this one and is idempotent (drop + recreate). This file
-- only exists so the local migration history matches what the remote
-- has so `supabase db push` / migration validation does not complain.

select 1;
