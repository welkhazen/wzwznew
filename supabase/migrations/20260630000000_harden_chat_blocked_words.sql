-- Enforce the admin blocked-word denylist inside send_community_message.
--
-- Problem: the frontend calls supabase.rpc('send_community_message') directly.
-- The client-side assertUserTextAllowed() only checks a static/local denylist.
-- The DB-managed blocked_words table was never consulted server-side, so a user
-- could bypass the UI and call the RPC directly with a blocked term.
--
-- Fix: add a blocked-word check inside the SECURITY DEFINER RPC, which runs
-- with elevated privileges and can read blocked_words regardless of RLS.
-- The check raises 'blocked_word' (SQLSTATE P0001) so the frontend can show
-- an appropriate error.

-- Helper: returns true if p_text (case-insensitive) contains any blocked term.
CREATE OR REPLACE FUNCTION public.text_contains_blocked_word(p_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_words
    WHERE position(normalized_term IN lower(p_text)) > 0
  );
$$;

REVOKE EXECUTE ON FUNCTION public.text_contains_blocked_word(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.text_contains_blocked_word(text) TO authenticated, service_role;

-- Replace send_community_message with blocked-word enforcement.
-- Signature unchanged — all callers continue to work without modification.
DROP FUNCTION IF EXISTS public.send_community_message(text, text, uuid, text, integer);

CREATE OR REPLACE FUNCTION public.send_community_message(
  p_community_id text,
  p_text text,
  p_reply_to_message_id uuid DEFAULT NULL,
  p_identity_alias text DEFAULT NULL,
  p_avatar_level integer DEFAULT NULL
)
RETURNS public.community_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_user public.users%ROWTYPE;
  v_is_member boolean;
  v_clean_text text;
  v_reply_sender text;
  v_reply_text text;
  v_sender_name text;
  v_sender_avatar_level integer;
  v_row public.community_messages;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_uid;
  IF NOT FOUND OR v_user.status = 'banned' THEN
    RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501';
  END IF;

  v_clean_text := btrim(coalesce(p_text, ''));
  IF length(v_clean_text) = 0 OR length(v_clean_text) > 2000 THEN
    RAISE EXCEPTION 'invalid_text_length' USING ERRCODE = '22023';
  END IF;

  -- Blocked-word enforcement (authoritative DB check, bypasses client-side only).
  IF public.text_contains_blocked_word(v_clean_text) THEN
    RAISE EXCEPTION 'blocked_word' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.community_members
     WHERE community_id = p_community_id
       AND user_id = v_uid::text
  ) INTO v_is_member;

  IF NOT v_is_member AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = '42501';
  END IF;

  v_sender_name := v_user.username;
  IF nullif(btrim(coalesce(p_identity_alias, '')), '') IS NOT NULL THEN
    SELECT alias
      INTO v_sender_name
      FROM public.user_aliases
     WHERE user_id = v_uid
       AND is_public = FALSE
       AND lower(alias) = lower(btrim(p_identity_alias))
     LIMIT 1;

    IF v_sender_name IS NULL THEN
      RAISE EXCEPTION 'invalid_identity_alias' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_avatar_level IS NOT NULL AND p_avatar_level BETWEEN 1 AND 100 THEN
    v_sender_avatar_level := p_avatar_level;
  ELSE
    v_sender_avatar_level := v_user.avatar_level;
  END IF;

  IF p_reply_to_message_id IS NOT NULL THEN
    SELECT sender_name, text
      INTO v_reply_sender, v_reply_text
      FROM public.community_messages
     WHERE id = p_reply_to_message_id
       AND community_id = p_community_id;
  END IF;

  INSERT INTO public.community_messages (
    community_id, sender_id, sender_name, sender_avatar_level,
    text, reply_to_message_id, reply_to_sender_name, reply_to_text
  ) VALUES (
    p_community_id,
    v_uid::text,
    v_sender_name,
    v_sender_avatar_level,
    v_clean_text,
    p_reply_to_message_id,
    v_reply_sender,
    v_reply_text
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_community_message(text, text, uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_community_message(text, text, uuid, text, integer) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
