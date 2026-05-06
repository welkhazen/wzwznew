-- Re-apply poll_comments RLS with explicit anon + authenticated grants.
-- The prior migration that contained this fix was partially rolled back.
drop policy if exists "Public read" on poll_comments;
drop policy if exists "Public insert" on poll_comments;

create policy "Public read" on poll_comments
  for select to anon, authenticated using (true);

create policy "Public insert" on poll_comments
  for insert to anon, authenticated with check (true);

-- Reload PostgREST schema cache so the table is immediately visible.
notify pgrst, 'reload schema';
