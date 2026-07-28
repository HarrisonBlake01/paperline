-- Prevent new tenant writes from racing whole-workspace deletion.

alter table public.workspaces
  add column lifecycle_state text not null default 'active'
    check (lifecycle_state in ('active', 'billing', 'deleting')),
  add column lifecycle_state_changed_at timestamptz not null default now();

create or replace function public.reject_non_writable_workspace_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_workspace_id uuid;
begin
  target_workspace_id := new.workspace_id;
  if target_workspace_id is null then
    return new;
  end if;

  if exists (
    select 1
    from public.workspaces
    where id = target_workspace_id
      and lifecycle_state <> 'active'
  ) then
    raise exception 'workspace_not_writable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

revoke all on function public.reject_non_writable_workspace_change() from public, anon, authenticated;

create trigger workspace_members_require_writable_workspace
  before insert or update on public.workspace_members
  for each row execute function public.reject_non_writable_workspace_change();
create trigger folders_require_writable_workspace
  before insert or update on public.folders
  for each row execute function public.reject_non_writable_workspace_change();
create trigger documents_require_writable_workspace
  before insert or update on public.documents
  for each row execute function public.reject_non_writable_workspace_change();
create trigger tags_require_writable_workspace
  before insert or update on public.tags
  for each row execute function public.reject_non_writable_workspace_change();
create trigger document_chunks_require_writable_workspace
  before insert or update on public.document_chunks
  for each row execute function public.reject_non_writable_workspace_change();
create trigger templates_require_writable_workspace
  before insert or update on public.templates
  for each row execute function public.reject_non_writable_workspace_change();
create trigger extractions_require_writable_workspace
  before insert or update on public.extractions
  for each row execute function public.reject_non_writable_workspace_change();
create trigger workflows_require_writable_workspace
  before insert or update on public.workflows
  for each row execute function public.reject_non_writable_workspace_change();
create trigger chats_require_writable_workspace
  before insert or update on public.chats
  for each row execute function public.reject_non_writable_workspace_change();
create trigger api_keys_require_writable_workspace
  before insert or update on public.api_keys
  for each row execute function public.reject_non_writable_workspace_change();
create trigger audit_logs_require_writable_workspace
  before insert or update on public.audit_logs
  for each row execute function public.reject_non_writable_workspace_change();
create trigger usage_events_require_writable_workspace
  before insert or update on public.usage_events
  for each row execute function public.reject_non_writable_workspace_change();
create trigger workspace_rate_limits_require_writable_workspace
  before insert or update on public.workspace_rate_limits
  for each row execute function public.reject_non_writable_workspace_change();
