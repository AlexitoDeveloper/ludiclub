-- LudiClub - Phase 3 groups and voting support
-- Run this file in your Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create public.groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code VARCHAR(12) NOT NULL UNIQUE DEFAULT ('GP-' || upper(encode(gen_random_bytes(3), 'hex'))),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure invite_code default is set if table already existed
ALTER TABLE public.groups
  ALTER COLUMN invite_code SET DEFAULT ('GP-' || upper(encode(gen_random_bytes(3), 'hex')));


-- 2. Create public.group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- 3. Create public.group_polls table
CREATE TABLE IF NOT EXISTS public.group_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meetup_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create public.group_poll_options table
CREATE TABLE IF NOT EXISTS public.group_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES public.games(bgg_id) ON DELETE CASCADE,
  UNIQUE (poll_id, game_id)
);

-- 5. Create public.group_poll_votes table
CREATE TABLE IF NOT EXISTS public.group_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES public.games(bgg_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id, game_id)
);

-- Triggers to auto-update updated_at field
CREATE OR REPLACE TRIGGER trg_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_group_polls_updated_at
BEFORE UPDATE ON public.group_polls
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_polls_group_id ON public.group_polls(group_id);
CREATE INDEX IF NOT EXISTS idx_group_poll_options_poll_id ON public.group_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_group_poll_votes_poll_id ON public.group_poll_votes(poll_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_poll_votes ENABLE ROW LEVEL SECURITY;

-- 1. groups policies
DROP POLICY IF EXISTS "groups_select_members" ON public.groups;
CREATE POLICY "groups_select_members" ON public.groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = id AND group_members.user_id = auth.uid())
    OR creator_id = auth.uid()
  );

DROP POLICY IF EXISTS "groups_insert_authenticated" ON public.groups;
CREATE POLICY "groups_insert_authenticated" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "groups_update_creator" ON public.groups;
CREATE POLICY "groups_update_creator" ON public.groups
  FOR UPDATE TO authenticated USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "groups_delete_creator" ON public.groups;
CREATE POLICY "groups_delete_creator" ON public.groups
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- 2. group_members policies
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.creator_id = auth.uid())
  );

-- 3. group_polls policies (only members can access/manipulate polls)
DROP POLICY IF EXISTS "group_polls_all_members" ON public.group_polls;
CREATE POLICY "group_polls_all_members" ON public.group_polls
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.creator_id = auth.uid())
  );

-- 4. group_poll_options policies
DROP POLICY IF EXISTS "group_poll_options_all_members" ON public.group_poll_options;
CREATE POLICY "group_poll_options_all_members" ON public.group_poll_options
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      JOIN public.group_members m ON m.group_id = p.group_id
      WHERE p.id = poll_id AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_polls p
      JOIN public.groups g ON g.id = p.group_id
      WHERE p.id = poll_id AND g.creator_id = auth.uid()
    )
  );

-- 5. group_poll_votes policies
DROP POLICY IF EXISTS "group_poll_votes_all_members" ON public.group_poll_votes;
CREATE POLICY "group_poll_votes_all_members" ON public.group_poll_votes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      JOIN public.group_members m ON m.group_id = p.group_id
      WHERE p.id = poll_id AND m.user_id = auth.uid()
    )
  );

-- Grant privileges for accessing API
GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_polls TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_poll_options TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_poll_votes TO anon, authenticated, service_role;
