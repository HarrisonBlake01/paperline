-- Durable reconciliation for private Storage objects created before document metadata.
-- Apply after 0017_lifecycle_checkout_recovery.sql.

create table if not exists public.storage_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null,
  bucket text not null,
  storage_path text not null,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create index if not exists storage_cleanup_jobs_due_idx
  on public.storage_cleanup_jobs (workspace_id, next_attempt_at, created_at);

alter table public.storage_cleanup_jobs enable row level security;

-- Cleanup jobs are an internal service-role queue. End users must never be able
-- to create a job for another tenant's storage path or suppress reconciliation.
revoke all on table public.storage_cleanup_jobs from anon, authenticated;
grant all on table public.storage_cleanup_jobs to service_role;
