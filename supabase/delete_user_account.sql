-- ==============================================================================
-- Migration: In-App User Account Deletion (Google Play & Apple Compliance)
-- Allows an authenticated user to permanently delete their account and personal data.
-- ==============================================================================

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  curr_user_id uuid;
  r_group record;
  v_new_creator_id uuid;
begin
  -- 1. Verify user is currently authenticated
  curr_user_id := auth.uid();
  if curr_user_id is null then
    raise exception 'Unauthorized: Only authenticated users can delete their own account.';
  end if;

  -- 2. Clean up joined_players and attended_players arrays in active/past meetups
  update public.meetups
  set joined_players = array_remove(joined_players, curr_user_id),
      attended_players = array_remove(attended_players, curr_user_id)
  where curr_user_id = any(joined_players) or curr_user_id = any(attended_players);

  -- 3. Delete user-owned objects from storage (avatars, uploads)
  delete from storage.objects
  where owner = curr_user_id
     or (bucket_id = 'avatars' and name like 'public/' || curr_user_id::text || '/%');

  -- 4. Reassign ownership of groups created by this user to another member if any exists,
  --    preventing active community groups from being wiped out by CASCADE
  for r_group in
    select id from public.groups where creator_id = curr_user_id
  loop
    select user_id into v_new_creator_id
    from public.group_members
    where group_id = r_group.id
      and user_id <> curr_user_id
    order by case when role = 'admin' then 0 else 1 end, joined_at asc
    limit 1;

    if v_new_creator_id is not null then
      update public.groups
      set creator_id = v_new_creator_id
      where id = r_group.id;

      update public.group_members
      set role = 'admin'
      where group_id = r_group.id and user_id = v_new_creator_id;
    end if;
  end loop;

  -- 5. Delete from public.users
  -- Foreign key constraints with ON DELETE CASCADE will clean up user collections,
  -- group memberships, poll votes, and created meetups.
  -- Orphaned groups (where user was the sole member) will cascade-delete.
  delete from public.users where id = curr_user_id;

  -- 6. Delete the authentication record permanently
  delete from auth.users where id = curr_user_id;
end;
$$;

-- Secure execution permissions
revoke all on function public.delete_user_account() from public;
revoke all on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated;

