ALTER TABLE public.user_aliases
  ADD COLUMN IF NOT EXISTS avatar_level INT NOT NULL DEFAULT 1;

ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS sender_avatar_level INT;

WITH ranked_aliases AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id
      ORDER BY is_public DESC, created_at ASC, id ASC
    ) AS next_avatar_level
  FROM public.user_aliases
)
UPDATE public.user_aliases AS alias
SET avatar_level = ranked_aliases.next_avatar_level
FROM ranked_aliases
WHERE alias.id = ranked_aliases.id;

DROP INDEX IF EXISTS public.user_aliases_user_alias_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_aliases_alias_key
  ON public.user_aliases (lower(alias));

CREATE UNIQUE INDEX IF NOT EXISTS user_aliases_user_avatar_level_key
  ON public.user_aliases (user_id, avatar_level);

CREATE OR REPLACE FUNCTION public.ensure_user_alias_available()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE lower(username) = lower(btrim(NEW.alias))
      AND id <> NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Name "%" is already taken.', NEW.alias
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_user_alias_available ON public.user_aliases;
CREATE TRIGGER ensure_user_alias_available
  BEFORE INSERT OR UPDATE OF alias, user_id ON public.user_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_alias_available();
