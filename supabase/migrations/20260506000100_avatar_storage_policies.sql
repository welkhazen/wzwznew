-- Allow uploads and reads for the avatars storage bucket.
-- The admin panel uploads avatar images; users need to read them.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "avatars: admin upload" on storage.objects;
drop policy if exists "avatars: admin delete" on storage.objects;

create policy "avatars: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars: admin upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'avatars');

create policy "avatars: admin delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'avatars');
