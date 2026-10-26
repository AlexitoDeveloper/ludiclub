-- LudiClub - Security Hardening: User Collection RLS
-- Run this script in your Supabase SQL Editor.
-- Enforces strict ownership on public.user_collection: only the account owner
-- can insert, update, or delete games in their personal game collection.
-- Cross-group admin modification/deletion is strictly prohibited to prevent data tampering.

-- 1. Ensure RLS is active
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;

-- 2. Clean up legacy / permissive policies
DROP POLICY IF EXISTS "user_collection_select_public" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_insert_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_insert_group_or_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_update_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_delete_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_delete_group_or_own" ON public.user_collection;

-- 3. Public read policy: Anyone can view user collections (for catalog/profile browsing)
CREATE POLICY "user_collection_select_public" ON public.user_collection
  FOR SELECT
  USING (true);

-- 4. Strict owner-only INSERT: Users can only add games to their own collection
CREATE POLICY "user_collection_insert_own" ON public.user_collection
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Strict owner-only UPDATE: Users can only update their own collection items
CREATE POLICY "user_collection_update_own" ON public.user_collection
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Strict owner-only DELETE: Only the owner can remove games from their collection
CREATE POLICY "user_collection_delete_own" ON public.user_collection
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_collection TO authenticated;
GRANT SELECT ON TABLE public.user_collection TO anon;
GRANT ALL ON TABLE public.user_collection TO service_role;

