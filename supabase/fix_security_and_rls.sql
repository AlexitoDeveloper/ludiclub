-- LudiClub - Security and RLS Fixes consolidated script
-- Run this in your Supabase SQL Editor.

-- ==========================================
-- 1. MEETUPS TABLE POLICIES & RPCs
-- ==========================================

-- Drop insecure update policy
DROP POLICY IF EXISTS "meetups_update_creator" ON public.meetups;
DROP POLICY IF EXISTS "meetups_update_authenticated" ON public.meetups;

-- Re-create insert/delete policies to ensure creator ownership
DROP POLICY IF EXISTS "meetups_insert_creator" ON public.meetups;
CREATE POLICY "meetups_insert_creator" ON public.meetups
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "meetups_delete_creator" ON public.meetups;
CREATE POLICY "meetups_delete_creator" ON public.meetups
  FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- Creator-only general updates
CREATE POLICY "meetups_update_creator" ON public.meetups
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Define secure database function for joining a meetup
CREATE OR REPLACE FUNCTION public.join_meetup(p_meetup_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- runs with service role bypass for RLS update
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

  -- Get meetup details (with row lock)
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

  -- Count current guests for this meetup
  SELECT COUNT(*)::int
  INTO v_guests_count
  FROM public.meetup_guests
  WHERE meetup_id = p_meetup_id;

  -- Check if full (counting both registered joined players and meetup guests)
  IF (v_joined_count + v_guests_count) >= v_max_players THEN
    RAISE EXCEPTION 'La mesa ya está llena' USING ERRCODE = 'ERR02';
  END IF;

  -- Add user to joined_players array
  UPDATE public.meetups
  SET joined_players = array_append(joined_players, v_user_id)
  WHERE id = p_meetup_id;
END;
$$;

-- Define secure database function for leaving a meetup
CREATE OR REPLACE FUNCTION public.leave_meetup(p_meetup_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- runs with service role bypass for RLS update
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_creator_id UUID;
  v_completed BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  -- Get meetup details (with lock)
  SELECT creator_id, completed
  INTO v_creator_id, v_completed
  FROM public.meetups
  WHERE id = p_meetup_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida no encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_completed THEN
    RAISE EXCEPTION 'La partida ya está finalizada' USING ERRCODE = 'ERR01';
  END IF;

  -- The creator cannot leave their own meetup (they must cancel it)
  IF v_creator_id = v_user_id THEN
    RAISE EXCEPTION 'El organizador no puede abandonar su propia partida' USING ERRCODE = 'ERR03';
  END IF;

  -- Remove user from joined_players array
  UPDATE public.meetups
  SET joined_players = array_remove(joined_players, v_user_id)
  WHERE id = p_meetup_id;
END;
$$;


-- ==========================================
-- 2. MEETUP GUESTS TABLE POLICIES & TRIGGERS
-- ==========================================

-- Drop wide-open public access policies
DROP POLICY IF EXISTS "meetup_guests_insert_public" ON public.meetup_guests;
DROP POLICY IF EXISTS "meetup_guests_delete_public" ON public.meetup_guests;
DROP POLICY IF EXISTS "meetup_guests_select_public" ON public.meetup_guests;

-- 2.1. Select: Allow anyone to view guest lists of meetups
CREATE POLICY "meetup_guests_select_public" ON public.meetup_guests
  FOR SELECT USING (true);

-- 2.2. Insert: Allow inserting guests but check limits via trigger (safer)
CREATE POLICY "meetup_guests_insert_public" ON public.meetup_guests
  FOR INSERT WITH CHECK (true);

-- 2.3. Delete: Allow only the meetup creator to delete guests directly via REST
CREATE POLICY "meetup_guests_delete_creator" ON public.meetup_guests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetups 
      WHERE id = meetup_id AND creator_id = auth.uid()
    )
  );

-- Database function to check meetup player limit (registered + guests) on insert
CREATE OR REPLACE FUNCTION public.check_meetup_guests_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_players INTEGER;
  v_joined_count INTEGER;
  v_guests_count INTEGER;
  v_completed BOOLEAN;
BEGIN
  -- Get max players and current status
  SELECT max_players, completed, COALESCE(cardinality(joined_players), 0)
  INTO v_max_players, v_completed, v_joined_count
  FROM public.meetups
  WHERE id = NEW.meetup_id;

  IF v_completed THEN
    RAISE EXCEPTION 'La partida ya está finalizada' USING ERRCODE = 'ERR01';
  END IF;

  -- Get current guest count
  SELECT COUNT(*)
  INTO v_guests_count
  FROM public.meetup_guests
  WHERE meetup_id = NEW.meetup_id;

  -- Enforce limit
  IF (v_joined_count + v_guests_count) >= v_max_players THEN
    RAISE EXCEPTION 'La mesa ya está llena' USING ERRCODE = 'ERR02';
  END IF;

  RETURN NEW;
END;
$$;

-- Register limit checking trigger
DROP TRIGGER IF EXISTS trg_check_meetup_guests_limit ON public.meetup_guests;
CREATE TRIGGER trg_check_meetup_guests_limit
  BEFORE INSERT ON public.meetup_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_meetup_guests_limit();

-- Secure RPC to delete a guest (allows anonymous guests to leave using their UUID)
CREATE OR REPLACE FUNCTION public.leave_meetup_as_guest(p_guest_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.meetup_guests
  WHERE id = p_guest_id;
END;
$$;


-- ==========================================
-- 3. MEETUP MESSAGES (CHATS) POLICIES
-- ==========================================

-- Drop old chat select policy
DROP POLICY IF EXISTS "meetup_messages_select_public" ON public.meetup_messages;

-- Restrict read permissions (compromise to allow active guests while securing past meetups)
CREATE POLICY "meetup_messages_select_secured" ON public.meetup_messages
  FOR SELECT
  TO authenticated, anon
  USING (
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.meetups
      WHERE id = meetup_id AND (creator_id = auth.uid() OR auth.uid() = ANY(joined_players))
    )) OR
    (auth.role() = 'anon' AND EXISTS (
      SELECT 1 FROM public.meetups
      WHERE id = meetup_id AND completed = false
    ))
  );


-- ==========================================
-- 4. GROUP POLL VOTES POLICIES
-- ==========================================

-- Drop old lax policy
DROP POLICY IF EXISTS "group_poll_votes_all_members" ON public.group_poll_votes;

-- Select: Any group member can view votes
CREATE POLICY "group_poll_votes_select" ON public.group_poll_votes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      JOIN public.group_members m ON m.group_id = p.group_id
      WHERE p.id = poll_id AND m.user_id = auth.uid()
    )
  );

-- Modify: Users can only write/update/delete their OWN votes
CREATE POLICY "group_poll_votes_modify_own" ON public.group_poll_votes
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_polls p
      JOIN public.group_members m ON m.group_id = p.group_id
      WHERE p.id = poll_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_polls p
      JOIN public.group_members m ON m.group_id = p.group_id
      WHERE p.id = poll_id AND m.user_id = auth.uid()
    )
  );


-- ==========================================
-- 5. GROUPS SELECT BY INVITE CODE FIX
-- ==========================================

-- Drop old restricted policy
DROP POLICY IF EXISTS "groups_select_members" ON public.groups;

-- Allow any authenticated user to view groups (needed for invite search & search flow)
CREATE POLICY "groups_select_authenticated" ON public.groups
  FOR SELECT TO authenticated USING (true);
