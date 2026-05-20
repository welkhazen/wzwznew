-- Remove obsolete text-based XP RPC overloads.
-- The app passes UUID strings. With both text and uuid overloads present,
-- PostgREST returns PGRST203 and the frontend falls back to local XP.
drop function if exists public.get_user_progress(text);
drop function if exists public.award_xp(text, integer);
drop function if exists public.award_xp_once(text, text, text, integer);
drop function if exists public.get_user_xp_claim_keys(text, text);
