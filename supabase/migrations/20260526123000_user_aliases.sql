CREATE TABLE IF NOT EXISTS public.user_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_aliases_alias_not_blank CHECK (length(btrim(alias)) BETWEEN 3 AND 32)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_aliases_user_alias_key
  ON public.user_aliases (user_id, lower(alias));

CREATE UNIQUE INDEX IF NOT EXISTS user_aliases_one_public_per_user
  ON public.user_aliases (user_id)
  WHERE is_public;

CREATE INDEX IF NOT EXISTS user_aliases_user_id_idx
  ON public.user_aliases (user_id);

ALTER TABLE public.user_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_aliases_select_all" ON public.user_aliases;
DROP POLICY IF EXISTS "user_aliases_insert_all" ON public.user_aliases;
DROP POLICY IF EXISTS "user_aliases_update_all" ON public.user_aliases;
DROP POLICY IF EXISTS "user_aliases_delete_all" ON public.user_aliases;

CREATE POLICY "user_aliases_select_all" ON public.user_aliases
  FOR SELECT USING (true);
CREATE POLICY "user_aliases_insert_all" ON public.user_aliases
  FOR INSERT WITH CHECK (true);
CREATE POLICY "user_aliases_update_all" ON public.user_aliases
  FOR UPDATE USING (true);
CREATE POLICY "user_aliases_delete_all" ON public.user_aliases
  FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_aliases TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_user_aliases_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_aliases_updated_at ON public.user_aliases;
CREATE TRIGGER set_user_aliases_updated_at
  BEFORE UPDATE ON public.user_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_aliases_updated_at();
