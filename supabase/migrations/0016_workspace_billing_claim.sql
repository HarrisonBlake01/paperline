-- Atomically exclude billing from active upload leases and deletion claims.

create or replace function public.claim_workspace_billing(
  p_workspace_id uuid,
  p_operation_token uuid
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

  update public.workspaces
    set lifecycle_state = 'billing',
        lifecycle_state_changed_at = now(),
        lifecycle_operation_token = p_operation_token
    where id = p_workspace_id;

  return true;
end;
$$;

revoke all on function public.claim_workspace_billing(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_workspace_billing(uuid, uuid) to service_role;
