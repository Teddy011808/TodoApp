-- Avatars: a profiles table, a public `avatars` bucket, and storage policies.
-- Run in Supabase → SQL Editor AFTER schema.sql. Safe to run once.

-- ---------------------------------------------------------------------------
-- profiles — one row per user, holding the avatar's public URL
-- ---------------------------------------------------------------------------

create table public.profiles (
  -- The profile's id IS the user's id, so there can only ever be one per user.
  id         uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ( auth.uid() = id );

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ( auth.uid() = id );

create policy "Users can edit their own profile"
on public.profiles
for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- ---------------------------------------------------------------------------
-- avatars bucket
-- ---------------------------------------------------------------------------
-- public = true: anyone can READ a file through its public URL (that is what
-- lets <img src> work without a token). Writing is still governed by the
-- policies below.
--
-- The size and type limits are enforced by Storage itself, server-side. They
-- mirror the client-side checks, so a request that skips the UI and calls the
-- API directly is still refused.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  1048576,  -- 1 MB, in bytes
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies — each user may only touch <their uid>/...
-- ---------------------------------------------------------------------------
-- Files are stored as  avatars/<user id>/avatar.
-- storage.foldername(name) splits the object path into its folders, so
-- (storage.foldername(name))[1] is the FIRST folder — it must equal the
-- caller's id. Every policy also pins bucket_id, so none of them grant
-- anything in any other bucket.
--
-- upsert: true needs INSERT (first upload), UPDATE (replacing it) and SELECT
-- (Storage checks whether the object already exists).

create policy "Users can upload into their own avatar folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can replace files in their own avatar folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can see files in their own avatar folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete files in their own avatar folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- ---------------------------------------------------------------------------
-- Audit queries
-- ---------------------------------------------------------------------------
-- Every avatars policy is pinned to the bucket AND to the caller's folder:
--   select policyname, cmd, qual, with_check
--   from pg_policies where schemaname = 'storage' and tablename = 'objects';
--
-- Re-upload replaces instead of duplicating — exactly one object per user:
--   select name, updated_at from storage.objects where bucket_id = 'avatars';
