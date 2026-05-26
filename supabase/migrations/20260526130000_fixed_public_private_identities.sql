UPDATE public.user_aliases AS alias
SET is_public = false
FROM public.users AS account
WHERE alias.user_id = account.id
  AND lower(alias.alias) = lower(account.username);

DELETE FROM public.user_aliases AS alias
USING public.users AS account
WHERE alias.user_id = account.id
  AND lower(alias.alias) = lower(account.username);

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
  ) THEN
    RAISE EXCEPTION 'Name "%" is already taken by a public account.', NEW.alias
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;
