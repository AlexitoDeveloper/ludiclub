-- ==============================================================================
-- LudiClub - Consolidated Pre-Launch Backend & Security Hardening Migration
-- File: supabase/pre_launch_hardening.sql
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. LEGAL ACCEPTANCE AUDIT FIELDS (GDPR / Google Play / App Store Compliance)
-- ------------------------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Ensure auth signup trigger ingests acceptance timestamps from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, terms_accepted_at, privacy_accepted_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.raw_user_meta_data ->> 'terms_accepted_at' IS NOT NULL 
         THEN (NEW.raw_user_meta_data ->> 'terms_accepted_at')::TIMESTAMPTZ ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data ->> 'privacy_accepted_at' IS NOT NULL 
         THEN (NEW.raw_user_meta_data ->> 'privacy_accepted_at')::TIMESTAMPTZ ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    terms_accepted_at = COALESCE(public.users.terms_accepted_at, EXCLUDED.terms_accepted_at),
    privacy_accepted_at = COALESCE(public.users.privacy_accepted_at, EXCLUDED.privacy_accepted_at);
  RETURN NEW;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. SECURE STORAGE BUCKET: meetup-boards (Session Photos)
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meetup-boards',
  'meetup-boards',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2.1 Public read access for meetup photos
DROP POLICY IF EXISTS "Meetup boards public read" ON storage.objects;
CREATE POLICY "Meetup boards public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'meetup-boards');

-- 2.2 Authenticated upload (authenticated users can upload session photos)
DROP POLICY IF EXISTS "Meetup boards authenticated upload" ON storage.objects;
CREATE POLICY "Meetup boards authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'meetup-boards'
    AND auth.role() = 'authenticated'
  );

-- 2.3 Authenticated modification restricted to owner
DROP POLICY IF EXISTS "Meetup boards authenticated update" ON storage.objects;
CREATE POLICY "Meetup boards authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'meetup-boards' AND auth.uid() = owner);

-- 2.4 Authenticated deletion restricted to owner
DROP POLICY IF EXISTS "Meetup boards authenticated delete" ON storage.objects;
CREATE POLICY "Meetup boards authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'meetup-boards' AND auth.uid() = owner);


-- ------------------------------------------------------------------------------
-- 3. CRYPTOGRAPHIC DEFAULT FOR GROUP INVITE CODES (GP-XXXXXX)
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'groups'
  ) THEN
    ALTER TABLE public.groups
      ALTER COLUMN invite_code SET DEFAULT ('GP-' || upper(encode(gen_random_bytes(3), 'hex')));
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 4. FIX CROSS-GROUP COLLECTION MUTATION/DELETION VULNERABILITY (public.user_collection)
-- Strict ownership: Only the user can insert, update, or delete in their personal collection.
-- ------------------------------------------------------------------------------

ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_collection_select_public" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_insert_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_insert_group_or_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_update_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_delete_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_delete_group_or_own" ON public.user_collection;

-- Anyone can browse public ludotecas
CREATE POLICY "user_collection_select_public" ON public.user_collection
  FOR SELECT
  USING (true);

-- Strictly owner-only insertions
CREATE POLICY "user_collection_insert_own" ON public.user_collection
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Strictly owner-only updates
CREATE POLICY "user_collection_update_own" ON public.user_collection
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Strictly owner-only deletions
CREATE POLICY "user_collection_delete_own" ON public.user_collection
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_collection TO authenticated;
GRANT SELECT ON TABLE public.user_collection TO anon;
GRANT ALL ON TABLE public.user_collection TO service_role;


-- ------------------------------------------------------------------------------
-- 5. FIX JOIN_MEETUP OVERBOOKING RACE CONDITION (Includes Guest Count & Row Lock)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.join_meetup(p_meetup_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_joined_count INTEGER;
  v_guests_count INTEGER;
  v_max_players INTEGER;
  v_completed BOOLEAN;
BEGIN
  -- Get the current authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  -- Get meetup details under exclusive row lock to prevent concurrency race conditions
  SELECT max_players, completed, COALESCE(cardinality(joined_players), 0)
  INTO v_max_players, v_completed, v_joined_count
  FROM public.meetups
  WHERE id = p_meetup_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida no encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_completed THEN
    RAISE EXCEPTION 'La partida ya está finalizada' USING ERRCODE = 'ERR01';
  END IF;

  -- Check if already joined
  IF EXISTS (
    SELECT 1 FROM public.meetups
    WHERE id = p_meetup_id AND v_user_id = ANY(joined_players)
  ) THEN
    RETURN; -- Already joined, exit silently
  END IF;

  -- Count active guests for this meetup
  SELECT COUNT(*)::int
  INTO v_guests_count
  FROM public.meetup_guests
  WHERE meetup_id = p_meetup_id;

  -- Enforce capacity: registered users + guests cannot exceed max_players
  IF (v_joined_count + v_guests_count) >= v_max_players THEN
    RAISE EXCEPTION 'La mesa ya está llena' USING ERRCODE = 'ERR02';
  END IF;

  -- Add user to joined_players array
  UPDATE public.meetups
  SET joined_players = array_append(joined_players, v_user_id)
  WHERE id = p_meetup_id;
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. COMPLETE GDPR / GOOGLE PLAY IN-APP ACCOUNT DELETION (public.delete_user_account)
-- Cleans up joined & attended meetups, storage objects, and reassigns community groups.
-- ------------------------------------------------------------------------------

-- Ensure attended_players column exists on meetups
ALTER TABLE public.meetups
  ADD COLUMN IF NOT EXISTS attended_players UUID[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  curr_user_id UUID;
  r_group RECORD;
  v_new_creator_id UUID;
BEGIN
  -- 1. Verify user is currently authenticated
  curr_user_id := auth.uid();
  IF curr_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only authenticated users can delete their own account.';
  END IF;

  -- 2. Clean up joined_players and attended_players arrays in active/past meetups
  UPDATE public.meetups
  SET joined_players = array_remove(joined_players, curr_user_id),
      attended_players = array_remove(attended_players, curr_user_id)
  WHERE curr_user_id = ANY(joined_players) OR curr_user_id = ANY(attended_players);

  -- 3. Delete user-owned objects from storage (avatars, meetup board uploads)
  DELETE FROM storage.objects
  WHERE owner = curr_user_id
     OR (bucket_id = 'avatars' AND name LIKE 'public/' || curr_user_id::text || '/%');

  -- 4. Reassign ownership of groups created by this user if other members exist,
  --    preventing active community groups from being wiped out by ON DELETE CASCADE
  FOR r_group IN
    SELECT id FROM public.groups WHERE creator_id = curr_user_id
  LOOP
    SELECT user_id INTO v_new_creator_id
    FROM public.group_members
    WHERE group_id = r_group.id
      AND user_id <> curr_user_id
    ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, joined_at ASC
    LIMIT 1;

    IF v_new_creator_id IS NOT NULL THEN
      UPDATE public.groups
      SET creator_id = v_new_creator_id
      WHERE id = r_group.id;

      UPDATE public.group_members
      SET role = 'admin'
      WHERE group_id = r_group.id AND user_id = v_new_creator_id;
    END IF;
  END LOOP;

  -- 5. Delete from public.users
  -- Foreign key constraints with ON DELETE CASCADE will clean up user collections,
  -- group memberships, poll votes, and created meetups.
  -- Orphaned groups (where user was the sole member) will cascade-delete.
  DELETE FROM public.users WHERE id = curr_user_id;

  -- 6. Delete the authentication record permanently
  DELETE FROM auth.users WHERE id = curr_user_id;
END;
$$;

-- Secure execution permissions
REVOKE ALL ON FUNCTION public.delete_user_account() FROM public;
REVOKE ALL ON FUNCTION public.delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
