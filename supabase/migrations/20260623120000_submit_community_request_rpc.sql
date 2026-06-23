-- Fix: "Request a new community" always failed with "Failed to submit request".
--
-- Root cause: community request submission was the only community write still
-- doing a direct table insert (.from('community_requests').insert(...)). The
-- 20260603170000 hardening migration revoked anon INSERT on community_requests
-- and replaced the open policy with an authenticated, self-scoped one
-- (requests_self_insert). The browser Supabase client only carries the
-- authenticated bearer token on .rpc() calls (every other community write —
-- join_community, send_community_message, join_community_waitlist — was moved to
-- SECURITY DEFINER RPCs for exactly this reason). The direct PostgREST insert
-- went out as the anon role and Postgres rejected it with
-- "42501: permission denied for table community_requests", so the table had zero
-- rows. The hardening migration's own note warned: "Frontend writes via RLS will
-- start being rejected for direct table writes ... and must route through the
-- RPCs". This RPC closes the one path that was missed.

CREATE OR REPLACE FUNCTION public.submit_community_request(
  p_community_name text,
  p_genre text,
  p_focus_area text,
  p_audience text,
  p_why_now text,
  p_sample_prompt text DEFAULT ''
)
RETURNS public.community_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_user public.users%ROWTYPE;
  v_row public.community_requests;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_uid;
  IF NOT FOUND OR v_user.status = 'banned' THEN
    RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501';
  END IF;

  IF btrim(coalesce(p_community_name, '')) = ''
     OR btrim(coalesce(p_genre, '')) = ''
     OR btrim(coalesce(p_focus_area, '')) = ''
     OR btrim(coalesce(p_audience, '')) = ''
     OR btrim(coalesce(p_why_now, '')) = '' THEN
    RAISE EXCEPTION 'missing_required_fields' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.community_requests (
    requester_id, requester_name, community_name, genre,
    focus_area, audience, why_now, sample_prompt
  ) VALUES (
    v_uid::text, v_user.username, p_community_name, p_genre,
    p_focus_area, p_audience, p_why_now, coalesce(p_sample_prompt, '')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_community_request(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_community_request(text, text, text, text, text, text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
