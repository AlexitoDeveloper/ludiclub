-- ==============================================================================
-- Migration: Public Account Deletion Requests
-- Allows unauthenticated users (anon) to submit a deletion request via the web.
-- Used by /delete-account public page (Google Play compliance).
-- ==============================================================================

create table if not exists public.account_deletion_requests (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null,
  status       text        not null default 'pending'
                           check (status in ('pending', 'processed', 'rejected')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_deletion_requests_status
  on public.account_deletion_requests (status);

create index if not exists idx_deletion_requests_email
  on public.account_deletion_requests (email);

alter table public.account_deletion_requests enable row level security;

-- Allow anyone (anon or authenticated) to INSERT a deletion request — no login needed
create policy "deletion_requests_insert_public"
  on public.account_deletion_requests
  for insert
  to anon, authenticated
  with check (true);

-- Only service_role (admin) can SELECT, UPDATE, DELETE
grant insert on public.account_deletion_requests to anon, authenticated;
grant all on public.account_deletion_requests to service_role;
