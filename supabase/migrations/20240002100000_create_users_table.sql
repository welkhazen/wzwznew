-- public.users was defined in schema.sql (run manually) but was never a migration.
-- This backfills it so db push works on a fresh project.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','member')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','warned','banned')),
  warnings        INT NOT NULL DEFAULT 0,
  avatar_level    INT NOT NULL DEFAULT 1,
  token_balance   INT NOT NULL DEFAULT 0,
  email           TEXT,
  phone           TEXT,
  stytch_user_id  TEXT,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all"  ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_select_all"  ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;

-- polls was created by migration 1 but is missing status/is_onboarding columns
-- needed by later migrations that insert poll data.
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS is_onboarding BOOLEAN NOT NULL DEFAULT false;

-- poll_options and poll_votes were in schema.sql but missing from migrations.
CREATE TABLE IF NOT EXISTS public.poll_options (
  id       TEXT PRIMARY KEY,
  poll_id  TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read"   ON public.poll_options;
DROP POLICY IF EXISTS "public_insert" ON public.poll_options;
DROP POLICY IF EXISTS "public_delete" ON public.poll_options;
CREATE POLICY "public_read"   ON public.poll_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert" ON public.poll_options FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_delete" ON public.poll_options FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "poll_votes_read"   ON public.poll_votes;
DROP POLICY IF EXISTS "poll_votes_insert" ON public.poll_votes;
CREATE POLICY "poll_votes_read"   ON public.poll_votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "poll_votes_insert" ON public.poll_votes FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT, INSERT, DELETE ON public.poll_options TO anon, authenticated;
GRANT SELECT, INSERT ON public.poll_votes TO anon, authenticated;
