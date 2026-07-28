-- Fence billing ownership and coordinate in-flight uploads with deletion.

alter table public.workspaces
  add column lifecycle_operation_token uuid;

alter table public.workspaces
  add constraint workspaces_lifecycle_operation_token_check
  check (
    (lifecycle_state = 'billing' and lifecycle_operation_token is not null)
    or (lifecycle_state <> 'billing' and lifecycle_operation_token is null)
  );

create table public.workspace_operation_leases (
  token uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('upload')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index workspace_operation_leases_workspace_expiry_idx
  on public.workspace_operation_leases(workspace_id, expires_at);

alter table public.workspace_operation_leases enable row level security;
revoke all on table public.workspace_operation_leases from public, anon, authenticated;
grant select, insert, delete on table public.workspace_operation_leases to service_role;

create or replace function public.begin_workspace_upload(
  p_workspace_id uuid,
  p_token uuid,
  p_lease_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_state text;
begin
  if p_lease_seconds < 60 or p_lease_seconds > 900 then
    return false;
  end if;

  select lifecycle_state
    into current_state
    from public.workspaces
    where id = p_workspace_id
    for update;

  if not found or current_state <> 'active' then
    return false;
  end if;

  delete from public.workspace_operation_leases
    where workspace_id = p_workspace_id
      and expires_at <= now();

  if exists (
    select 1
    from public.workspace_operation_leases
    where workspace_id = p_workspace_id
  ) then
    return false;
  end if;

  insert into public.workspace_operation_leases (
    token,
    workspace_id,
    kind,
    expires_at
  ) values (
    p_token,
    p_workspace_id,
    'upload',
    now() + make_interval(secs => p_lease_seconds)
  );

  return true;
end;
$$;

create or replace function public.end_workspace_upload(
  p_workspace_id uuid,
  p_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed_count integer;
begin
  delete from public.workspace_operation_leases
    where workspace_id = p_workspace_id
      and token = p_token
      and kind = 'upload';
  get diagnostics removed_count = row_count;
  return removed_count = 1;
end;
$$;

create or replace function public.claim_workspace_deletion(
  p_workspace_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_state text;
begin
  select lifecycle_state
    into current_state
    from public.workspaces
    where id = p_workspace_id
    for update;

  if not found then
    return false;
  end if;
  if current_state = 'deleting' then
    return true;
  end if;
  if current_state <> 'active' then
    return false;
  end if;

  delete from public.workspace_operation_leases
    where workspace_id = p_workspace_id
      and expires_at <= now();

  if exists (
    select 1
    from public.workspace_operation_leases
    where workspace_id = p_workspace_id
  ) then
    return false;
  end if;

  update public.workspaces
    set lifecycle_state = 'deleting',
        lifecycle_state_changed_at = now(),
        lifecycle_operation_token = null
    where id = p_workspace_id;

  return true;
end;
$$;

revoke all on function public.begin_workspace_upload(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.end_workspace_upload(uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_workspace_deletion(uuid) from public, anon, authenticated;
grant execute on function public.begin_workspace_upload(uuid, uuid, integer) to service_role;
grant execute on function public.end_workspace_upload(uuid, uuid) to service_role;
grant execute on function public.claim_workspace_deletion(uuid) to service_role;
