-- Harden RLS, column grants, and add secure RPCs for chat + token spend.
-- Non-destructive: no DELETE/DROP TABLE. Idempotent: DROP POLICY IF EXISTS.
--
-- Auth model note: this migration prepares the database for proper
-- Supabase Auth. Until the custom username/password flow finishes migrating
-- to auth.uid(), the API/edge routes are the only callers allowed to write.
-- Frontend writes via RLS will start being rejected for direct table writes
-- on the affected tables and must route through the RPCs added below.

-- ─── Helper functions ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  -- Today: returns auth.uid() when Supabase Auth is in use.
  -- TODO: when custom username/password auth is replaced with Supabase Auth,
  -- this stays identical. The transitional API layer must mint a Supabase
  -- session for custom-auth users so RPCs can read auth.uid() here.
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = public.current_user_id()
      AND u.role = 'admin'
      AND u.status = 'active'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ─── public.users lockdown ─────────────────────────────────────────────────
-- Drop all open policies and reset grants. Anon/authenticated can only read
-- safe columns; password_hash, email, phone, token_balance, role-sensitive
-- writes go through admin or server-side paths.

DROP POLICY IF EXISTS "users_select_all"           ON public.users;
DROP POLICY IF EXISTS "users_insert_self"          ON public.users;
DROP POLICY IF EXISTS "users_update_self"          ON public.users;
DROP POLICY IF EXISTS "users_public_profile_read"  ON public.users;
DROP POLICY IF EXISTS "users_limited_public_update" ON public.users;
DROP POLICY IF EXISTS "users_self_update"          ON public.users;
DROP POLICY IF EXISTS "users_admin_all"            ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT (
  id, username, role, status, warnings, avatar_level,
  created_at, onboarding_completed, profile_public
) ON public.users TO anon, authenticated;
GRANT UPDATE (
  avatar_level, onboarding_completed, profile_public
) ON public.users TO authenticated;

CREATE POLICY "users_public_profile_read"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "users_self_update"
ON public.users
FOR UPDATE
TO authenticated
USING (id = public.current_user_id())
WITH CHECK (id = public.current_user_id());

CREATE POLICY "users_admin_all"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── community_messages: writes only through RPCs ──────────────────────────

DROP POLICY IF EXISTS "anon_write"   ON public.community_messages;
DROP POLICY IF EXISTS "anon_update"  ON public.community_messages;
DROP POLICY IF EXISTS "public_write" ON public.community_messages;

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.community_messages FROM anon, authenticated;
-- public read stays as defined in earlier migrations

-- ─── community_members: owner-scoped writes ────────────────────────────────

DROP POLICY IF EXISTS "anon_write"  ON public.community_members;
DROP POLICY IF EXISTS "anon_update" ON public.community_members;

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.community_members FROM anon;

CREATE POLICY "members_self_insert"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "members_self_update"
ON public.community_members
FOR UPDATE
TO authenticated
USING (user_id = public.current_user_id())
WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "members_self_or_admin_delete"
ON public.community_members
FOR DELETE
TO authenticated
USING (user_id = public.current_user_id() OR public.is_admin());

-- ─── community_waitlist: owner-scoped insert ──────────────────────────────

DROP POLICY IF EXISTS "anon_write" ON public.community_waitlist;

ALTER TABLE public.community_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.community_waitlist FROM anon;

CREATE POLICY "waitlist_self_insert"
ON public.community_waitlist
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "waitlist_admin_manage"
ON public.community_waitlist
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── community_requests: requester-scoped + admin moderation ──────────────

DROP POLICY IF EXISTS "anon_write"  ON public.community_requests;
DROP POLICY IF EXISTS "anon_update" ON public.community_requests;

ALTER TABLE public.community_requests ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.community_requests FROM anon;

CREATE POLICY "requests_self_insert"
ON public.community_requests
FOR INSERT
TO authenticated
WITH CHECK (requester_id = public.current_user_id());

CREATE POLICY "requests_admin_update"
ON public.community_requests
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── user_avatar_inventory: owner-scoped ──────────────────────────────────

DROP POLICY IF EXISTS "avatar_inventory_write_anon" ON public.user_avatar_inventory;
DROP POLICY IF EXISTS "avatar_inventory_read_anon"  ON public.user_avatar_inventory;

ALTER TABLE public.user_avatar_inventory ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.user_avatar_inventory FROM anon;

CREATE POLICY "avatar_inventory_read_public"
ON public.user_avatar_inventory
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "avatar_inventory_owner_write"
ON public.user_avatar_inventory
FOR ALL
TO authenticated
USING (user_id = public.current_user_id() OR public.is_admin())
WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

-- ─── user_avatar_selection: owner-scoped ──────────────────────────────────

DROP POLICY IF EXISTS "avatar_selection_write_anon" ON public.user_avatar_selection;
DROP POLICY IF EXISTS "avatar_selection_read_anon"  ON public.user_avatar_selection;

ALTER TABLE public.user_avatar_selection ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.user_avatar_selection FROM anon;

CREATE POLICY "avatar_selection_read_public"
ON public.user_avatar_selection
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "avatar_selection_owner_write"
ON public.user_avatar_selection
FOR ALL
TO authenticated
USING (user_id = public.current_user_id() OR public.is_admin())
WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

-- ─── daily_spin_pool: curated, admin-only writes ──────────────────────────

DROP POLICY IF EXISTS "daily_spin_pool_write_all" ON public.daily_spin_pool;
DROP POLICY IF EXISTS "daily_spin_pool_read_all"  ON public.daily_spin_pool;

ALTER TABLE public.daily_spin_pool ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.daily_spin_pool FROM anon, authenticated;

CREATE POLICY "daily_spin_pool_read_public"
ON public.daily_spin_pool
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "daily_spin_pool_admin_write"
ON public.daily_spin_pool
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── landing_new_avatars: admin-only writes ───────────────────────────────

DROP POLICY IF EXISTS "Authenticated write landing_new_avatars" ON public.landing_new_avatars;
DROP POLICY IF EXISTS "Public read landing_new_avatars"         ON public.landing_new_avatars;

ALTER TABLE public.landing_new_avatars ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.landing_new_avatars FROM anon, authenticated;

CREATE POLICY "landing_new_avatars_read_public"
ON public.landing_new_avatars
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "landing_new_avatars_admin_write"
ON public.landing_new_avatars
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── avatar_catalog: admin-only writes ────────────────────────────────────

ALTER TABLE public.avatar_catalog ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.avatar_catalog FROM anon, authenticated;

DROP POLICY IF EXISTS "avatar_catalog_read_public"  ON public.avatar_catalog;
DROP POLICY IF EXISTS "avatar_catalog_admin_write"  ON public.avatar_catalog;

CREATE POLICY "avatar_catalog_read_public"
ON public.avatar_catalog
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "avatar_catalog_admin_write"
ON public.avatar_catalog
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── Storage: avatars bucket ──────────────────────────────────────────────

DROP POLICY IF EXISTS "avatars: public read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars: admin upload"  ON storage.objects;
DROP POLICY IF EXISTS "avatars: admin delete"  ON storage.objects;

CREATE POLICY "avatars: public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatars: admin upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

CREATE POLICY "avatars: admin update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin())
WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

CREATE POLICY "avatars: admin delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin());

-- ─── RPC: send_community_message ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.send_community_message(
  p_community_id text,
  p_text text,
  p_reply_to_message_id uuid DEFAULT NULL
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

  SELECT EXISTS (
    SELECT 1 FROM public.community_members
     WHERE community_id = p_community_id
       AND user_id = v_uid
  ) INTO v_is_member;

  IF NOT v_is_member AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_a_member' USING ERRCODE = '42501';
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
    v_uid,
    v_user.username,
    v_user.avatar_level,
    v_clean_text,
    p_reply_to_message_id,
    v_reply_sender,
    v_reply_text
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_community_message(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_community_message(text, text, uuid) TO authenticated, service_role;

-- ─── RPC: delete_community_message ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_community_message(p_message_id uuid)
RETURNS public.community_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_row public.community_messages;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '28000';
  END IF;

  UPDATE public.community_messages
     SET deleted_at = now(),
         deleted_by_user_id = v_uid
   WHERE id = p_message_id
     AND deleted_at IS NULL
     AND (sender_id = v_uid OR public.is_admin())
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_authorized_or_already_deleted' USING ERRCODE = '42501';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_community_message(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_community_message(uuid) TO authenticated, service_role;

-- ─── RPC: spend_tokens hardening ──────────────────────────────────────────
-- Replaces any prior spend_tokens(p_user_id, p_amount). The new signature
-- derives the user from current_user_id() so the URL/argument can no longer
-- be used to spend somebody else's balance.

DROP FUNCTION IF EXISTS public.spend_tokens(uuid, integer);
DROP FUNCTION IF EXISTS public.spend_tokens(integer);

CREATE OR REPLACE FUNCTION public.spend_tokens(p_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_balance integer;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  UPDATE public.users
     SET token_balance = token_balance - p_amount
   WHERE id = v_uid
     AND token_balance >= p_amount
  RETURNING token_balance INTO v_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_balance');
  END IF;

  RETURN jsonb_build_object('ok', true, 'balance', v_balance);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spend_tokens(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_tokens(integer) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
