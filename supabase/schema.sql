-- LudiClub - Phase 1 schema
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Keep updated_at current on row updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  city text,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- Auto-create a profile row after signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, terms_accepted_at, privacy_accepted_at)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'terms_accepted_at' is not null then (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz else null end,
    case when new.raw_user_meta_data ->> 'privacy_accepted_at' is not null then (new.raw_user_meta_data ->> 'privacy_accepted_at')::timestamptz else null end
  )
  on conflict (id) do update set
    terms_accepted_at = coalesce(public.users.terms_accepted_at, excluded.terms_accepted_at),
    privacy_accepted_at = coalesce(public.users.privacy_accepted_at, excluded.privacy_accepted_at);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_auth_user();

create table if not exists public.games_cache (
  bgg_id integer primary key,
  title text not null,
  year integer,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_games_cache_updated_at
before update on public.games_cache
for each row
execute function public.set_updated_at();

create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users (id) on delete cascade,
  game_id integer not null references public.games_cache (bgg_id) on delete restrict,
  title text not null,
  description text,
  city text not null,
  location text not null,
  date timestamptz not null,
  max_players integer not null check (max_players between 2 and 50),
  joined_players uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_meetup_joined_players_limit
    check (coalesce(cardinality(joined_players), 0) <= max_players)
);

create trigger trg_meetups_updated_at
before update on public.meetups
for each row
execute function public.set_updated_at();


create index if not exists idx_meetups_city on public.meetups (city);
create index if not exists idx_meetups_game_id on public.meetups (game_id);
create index if not exists idx_meetups_date on public.meetups (date);

alter table public.users enable row level security;
alter table public.games_cache enable row level security;

alter table public.meetups enable row level security;

-- USERS RLS
create policy "users_select_public"
on public.users
for select
using (true);

create policy "users_insert_own_profile"
on public.users
for insert
to authenticated
with check (id = auth.uid());

create policy "users_update_own_profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users_delete_own_profile"
on public.users
for delete
to authenticated
using (id = auth.uid());

-- GAMES CACHE RLS (read by authenticated users, write by service role only)
create policy "games_cache_select_public"
on public.games_cache
for select
using (true);

create policy "games_cache_insert_service_role"
on public.games_cache
for insert
to service_role
with check (true);

create policy "games_cache_update_service_role"
on public.games_cache
for update
to service_role
using (true)
with check (true);

create policy "games_cache_delete_service_role"
on public.games_cache
for delete
to service_role
using (true);

-- MEETUPS RLS
create policy "meetups_select_public"
on public.meetups
for select
using (true);

create policy "meetups_insert_creator"
on public.meetups
for insert
to authenticated
with check (creator_id = auth.uid());

create policy "meetups_update_authenticated"
on public.meetups
for update
to authenticated
using (true)
with check (true);

create policy "meetups_delete_creator"
on public.meetups
for delete
to authenticated
using (creator_id = auth.uid());

-- ==========================================
-- ROLE GRANTS (Allows Supabase API access)
-- ==========================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions to public.users
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- Grant permissions to public.games_cache
GRANT ALL ON TABLE public.games_cache TO anon, authenticated, service_role;

-- Grant permissions to public.meetups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.meetups TO anon, authenticated, service_role;

-- If a custom games table exists in the database, grant access to it as well
GRANT ALL ON TABLE public.games TO anon, authenticated, service_role;

