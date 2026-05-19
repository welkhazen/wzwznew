-- Allow a user to insert their own profile row (auth.uid() must match id)
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create a public.users row whenever auth.users gets a new entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _username text;
BEGIN
  _username := trim(new.raw_user_meta_data->>'username');
  IF _username IS NULL OR _username = '' THEN
    RETURN new;
  END IF;

  INSERT INTO public.users (id, username, role, status, warnings, avatar_level)
  VALUES (new.id, _username, 'user', 'active', 0, 1)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
