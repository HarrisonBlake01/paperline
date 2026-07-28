-- Owner-fenced lifecycle recovery, durable checkout operations, and atomic document cleanup.
-- Apply only after 0014, 0015, and 0016. Existing migrations are intentionally unchanged.

-- 0015 could place a workspace in ownerless `deleting`. That state may already
-- have irreversible external effects, so fail with an actionable preflight
-- instead of guessing a token or silently reactivating it.
do $$
begin
  if exists (
    select 1 from public.workspaces
    where lifecycle_state = 'deleting'
      and lifecycle_operation_token is null
  ) then
    raise exception 'paperline_0017_legacy_deleting_workspace_requires_manual_reconciliation'
      using hint = 'Inspect and reconcile every legacy deleting workspace before retrying migration 0017; do not reactivate it automatically.';
  end if;
end;
$$;

alter table public.workspaces
  add column lifecycle_operation_phase text;

alter table public.workspaces
  drop constraint if exists workspaces_lifecycle_operation_token_check;

alter table public.workspaces
  add constraint workspaces_lifecycle_operation_token_check
  check (
    (lifecycle_state = 'active' and lifecycle_operation_token is null and lifecycle_operation_phase is null)
    or (lifecycle_state = 'billing' and lifecycle_operation_token is not null and lifecycle_operation_phase is null)
    or (
      lifecycle_state = 'deleting'
      and lifecycle_operation_token is not null
      and lifecycle_operation_phase in ('preflight', 'destructive')
    )
  );

create table public.workspace_billing_operations (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_plan text not null check (requested_plan in ('pro', 'team')),
  status text not null default 'creating'
    check (status in ('creating', 'open', 'completed', 'expired', 'failed')),
  stripe_customer_id text,
  stripe_session_id text unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspace_billing_operations_workspace_status_idx
  on public.workspace_billing_operations(workspace_id, status, updated_at desc);
create unique index workspace_billing_operations_one_pending_idx
  on public.workspace_billing_operations(workspace_id)
  where status in ('creating', 'open');

alter table public.workspace_billing_operations enable row level security;
revoke all on table public.workspace_billing_operations from public, anon, authenticated;
grant select, insert, update, delete on table public.workspace_billing_operations to service_role;

-- A deleting workspace is owned by one opaque request token. After the bounded
-- request lease is stale, a retry may atomically replace that token; every old
-- claimant is then fenced from release, compensation, and final deletion.
drop function if exists public.claim_workspace_deletion(uuid);
create function public.claim_workspace_deletion(
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
  current_token uuid;
  changed_at timestamptz;
begin
  select lifecycle_state, lifecycle_operation_token, lifecycle_state_changed_at
    into current_state, current_token, changed_at
    from public.workspaces
    where id = p_workspace_id
    for update;

  if not found then
    return false;
  end if;

  if current_state = 'deleting' then
    if changed_at <= now() - interval '15 minutes' then
      update public.workspaces
        set lifecycle_state_changed_at = now(),
            lifecycle_operation_token = p_operation_token
        where id = p_workspace_id
          and lifecycle_state = 'deleting'
          and lifecycle_operation_token = current_token;
      return true;
    end if;
    return false;
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
        lifecycle_operation_token = p_operation_token,
        lifecycle_operation_phase = 'preflight'
    where id = p_workspace_id
      and lifecycle_state = 'active';

  return found;
end;
$$;

create function public.renew_workspace_deletion(
  p_workspace_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  update public.workspaces
    set lifecycle_state_changed_at = now()
    where id = p_workspace_id
      and lifecycle_state = 'deleting'
      and lifecycle_operation_token = p_operation_token;
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

create function public.begin_workspace_destructive_deletion(
  p_workspace_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  update public.workspaces
    set lifecycle_operation_phase = 'destructive',
        lifecycle_state_changed_at = now()
    where id = p_workspace_id
      and lifecycle_state = 'deleting'
      and lifecycle_operation_token = p_operation_token
      and lifecycle_operation_phase in ('preflight', 'destructive');
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

create function public.pause_workspace_deletion(
  p_workspace_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  update public.workspaces
    set lifecycle_state_changed_at = now() - interval '16 minutes'
    where id = p_workspace_id
      and lifecycle_state = 'deleting'
      and lifecycle_operation_token = p_operation_token;
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

create function public.release_workspace_deletion(
  p_workspace_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  update public.workspaces
    set lifecycle_state = 'active',
        lifecycle_state_changed_at = now(),
        lifecycle_operation_token = null,
        lifecycle_operation_phase = null
    where id = p_workspace_id
      and lifecycle_state = 'deleting'
      and lifecycle_operation_token = p_operation_token
      and lifecycle_operation_phase = 'preflight';
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

create function public.delete_claimed_workspace(
  p_workspace_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.workspaces
    where id = p_workspace_id
      and lifecycle_state = 'deleting'
      and lifecycle_operation_token = p_operation_token
      and lifecycle_operation_phase = 'destructive';
  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

-- A billing operation is durable and keyed by the caller-provided logical
-- operation UUID. Only that UUID may recover its own stale request lease.
drop function if exists public.claim_workspace_billing(uuid, uuid);
create function public.claim_workspace_billing(
  p_workspace_id uuid,
  p_operation_token uuid,
  p_requested_plan text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_state text;
  current_token uuid;
  changed_at timestamptz;
  existing_workspace uuid;
  existing_plan text;
  existing_status text;
begin
  if p_requested_plan not in ('pro', 'team') then
    return false;
  end if;

  select lifecycle_state, lifecycle_operation_token, lifecycle_state_changed_at
    into current_state, current_token, changed_at
    from public.workspaces
    where id = p_workspace_id
    for update;

  if not found then
    return false;
  end if;

  select workspace_id, requested_plan, status
    into existing_workspace, existing_plan, existing_status
    from public.workspace_billing_operations
    where id = p_operation_token;

  if found and (
    existing_workspace <> p_workspace_id
    or existing_plan <> p_requested_plan
    or existing_status not in ('creating', 'open')
  ) then
    return false;
  end if;

  if current_state = 'billing' then
    if current_token <> p_operation_token
       or changed_at > now() - interval '15 minutes' then
      return false;
    end if;
  elsif current_state <> 'active' then
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

  if not exists (
    select 1 from public.workspace_billing_operations
    where id = p_operation_token
  ) then
    if exists (
      select 1 from public.workspace_billing_operations
      where workspace_id = p_workspace_id
        and status in ('creating', 'open')
    ) then
      return false;
    end if;

    insert into public.workspace_billing_operations (
      id,
      workspace_id,
      requested_plan,
      status
    ) values (
      p_operation_token,
      p_workspace_id,
      p_requested_plan,
      'creating'
    );
  end if;

  update public.workspace_billing_operations
    set updated_at = now()
    where id = p_operation_token
      and workspace_id = p_workspace_id
      and status in ('creating', 'open');

  update public.workspaces
    set lifecycle_state = 'billing',
        lifecycle_state_changed_at = now(),
        lifecycle_operation_token = p_operation_token
    where id = p_workspace_id;

  return true;
end;
$$;

create function public.record_workspace_checkout_session(
  p_workspace_id uuid,
  p_operation_token uuid,
  p_customer_id text,
  p_session_id text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  if not exists (
    select 1 from public.workspaces
    where id = p_workspace_id
      and lifecycle_state = 'billing'
      and lifecycle_operation_token = p_operation_token
      and (stripe_customer_id is null or stripe_customer_id = p_customer_id)
    for update
  ) then
    return false;
  end if;

  update public.workspaces
    set stripe_customer_id = p_customer_id
    where id = p_workspace_id
      and lifecycle_state = 'billing'
      and lifecycle_operation_token = p_operation_token;

  update public.workspace_billing_operations
    set status = 'open',
        stripe_customer_id = p_customer_id,
        stripe_session_id = p_session_id,
        expires_at = p_expires_at,
        updated_at = now()
    where id = p_operation_token
      and workspace_id = p_workspace_id
      and status in ('creating', 'open')
      and (stripe_session_id is null or stripe_session_id = p_session_id);
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

create function public.release_workspace_billing(
  p_workspace_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  update public.workspaces
    set lifecycle_state = 'active',
        lifecycle_state_changed_at = now(),
        lifecycle_operation_token = null
    where id = p_workspace_id
      and lifecycle_state = 'billing'
      and lifecycle_operation_token = p_operation_token;
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

-- Document deletion uses a durable owner token. External object erasure happens
-- before one transactional relational finalizer so retries tolerate an already
-- missing object without partially deleting the database graph.
alter table public.documents
  add column deletion_token uuid,
  add column deletion_started_at timestamptz;

alter table public.documents
  drop constraint if exists documents_status_check;
alter table public.documents
  add constraint documents_status_check
  check (status in ('queued', 'processing', 'ready', 'failed', 'deleting'));
alter table public.documents
  add constraint documents_deletion_token_check
  check (
    (status = 'deleting' and deletion_token is not null and deletion_started_at is not null)
    or (status <> 'deleting' and deletion_token is null and deletion_started_at is null)
  );

create function public.claim_document_deletion(
  p_workspace_id uuid,
  p_document_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  workspace_state text;
  current_status text;
  current_token uuid;
  started_at timestamptz;
begin
  select lifecycle_state into workspace_state
    from public.workspaces
    where id = p_workspace_id
    for update;
  if not found or workspace_state <> 'active' then
    return false;
  end if;

  delete from public.workspace_operation_leases
    where workspace_id = p_workspace_id
      and expires_at <= now();
  if exists (
    select 1 from public.workspace_operation_leases
    where workspace_id = p_workspace_id
  ) then
    return false;
  end if;

  select status, deletion_token, deletion_started_at
    into current_status, current_token, started_at
    from public.documents
    where id = p_document_id
      and workspace_id = p_workspace_id
    for update;

  if not found then
    return false;
  end if;

  if current_status = 'deleting' then
    if started_at <= now() - interval '15 minutes' then
      update public.documents
        set deletion_started_at = now(),
            deletion_token = p_operation_token
        where id = p_document_id
          and workspace_id = p_workspace_id
          and deletion_token = current_token;
      return true;
    end if;
    return false;
  end if;

  update public.documents
    set status = 'deleting',
        deletion_token = p_operation_token,
        deletion_started_at = now(),
        updated_at = now()
    where id = p_document_id
      and workspace_id = p_workspace_id
      and status <> 'deleting';
  return found;
end;
$$;

create function public.pause_document_deletion(
  p_workspace_id uuid,
  p_document_id uuid,
  p_operation_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
begin
  update public.documents
    set deletion_started_at = now() - interval '16 minutes',
        updated_at = now()
    where id = p_document_id
      and workspace_id = p_workspace_id
      and status = 'deleting'
      and deletion_token = p_operation_token;
  get diagnostics changed_count = row_count;
  return changed_count = 1;
end;
$$;

create function public.finalize_document_deletion(
  p_workspace_id uuid,
  p_document_id uuid,
  p_operation_token uuid,
  p_actor_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_chat_ids uuid[];
  deleted_count integer;
  orphan_chat_count integer := 0;
begin
  perform 1
    from public.documents
    where id = p_document_id
      and workspace_id = p_workspace_id
      and status = 'deleting'
      and deletion_token = p_operation_token
    for update;
  if not found then
    return false;
  end if;

  select coalesce(array_agg(chat_id), '{}'::uuid[])
    into affected_chat_ids
    from public.chat_documents
    where document_id = p_document_id;

  delete from public.chat_documents
    where document_id = p_document_id;

  if cardinality(affected_chat_ids) > 0 then
    delete from public.chats c
      where c.workspace_id = p_workspace_id
        and c.id = any(affected_chat_ids)
        and not exists (
          select 1 from public.chat_documents cd
          where cd.chat_id = c.id
        );
    get diagnostics orphan_chat_count = row_count;
  end if;

  delete from public.usage_events
    where workspace_id = p_workspace_id
      and reference_id = p_document_id;
  delete from public.audit_logs
    where workspace_id = p_workspace_id
      and target_id = p_document_id;

  delete from public.documents
    where id = p_document_id
      and workspace_id = p_workspace_id
      and status = 'deleting'
      and deletion_token = p_operation_token;
  get diagnostics deleted_count = row_count;
  if deleted_count <> 1 then
    raise exception 'document_deletion_claim_lost' using errcode = '55000';
  end if;

  insert into public.audit_logs (
    workspace_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  ) values (
    p_workspace_id,
    p_actor_user_id,
    'document.deleted',
    'document',
    p_document_id,
    jsonb_build_object(
      'orphan_chats_deleted', orphan_chat_count,
      'operation_token', p_operation_token
    )
  );

  return true;
end;
$$;

-- Validate both sides of tenant-row moves. Deletes remain permitted so the
-- owner-tokened finalizers and workspace cascades can make forward progress.
create or replace function public.reject_non_writable_workspace_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_workspace_id uuid;
begin
  if tg_op = 'UPDATE' then
    target_workspace_id := old.workspace_id;
    if target_workspace_id is not null and exists (
      select 1 from public.workspaces
      where id = target_workspace_id and lifecycle_state <> 'active'
    ) then
      raise exception 'workspace_not_writable' using errcode = '55000';
    end if;
  end if;

  target_workspace_id := new.workspace_id;
  if target_workspace_id is not null and exists (
    select 1 from public.workspaces
    where id = target_workspace_id and lifecycle_state <> 'active'
  ) then
    raise exception 'workspace_not_writable' using errcode = '55000';
  end if;

  return new;
end;
$$;

create function public.assert_writable_workspace_relationship(
  p_source_workspace_id uuid,
  p_related_workspace_id uuid,
  p_optional_workspace_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_source_workspace_id is null
     or p_related_workspace_id is null
     or p_source_workspace_id <> p_related_workspace_id
     or (p_optional_workspace_id is not null and p_source_workspace_id <> p_optional_workspace_id)
     or exists (
       select 1 from public.workspaces
       where id = p_source_workspace_id and lifecycle_state <> 'active'
     ) then
    raise exception 'workspace_not_writable' using errcode = '55000';
  end if;
end;
$$;

create function public.reject_non_writable_join_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  source_workspace_id uuid;
  related_workspace_id uuid;
  optional_workspace_id uuid;
begin
  if tg_op = 'UPDATE' then
    if tg_table_name = 'chat_documents' then
      select workspace_id into source_workspace_id from public.chats where id = old.chat_id;
      select workspace_id into related_workspace_id from public.documents where id = old.document_id;
    elsif tg_table_name = 'chat_messages' then
      select workspace_id into source_workspace_id from public.chats where id = old.chat_id;
      related_workspace_id := source_workspace_id;
    elsif tg_table_name = 'document_tags' then
      select workspace_id into source_workspace_id from public.documents where id = old.document_id;
      select workspace_id into related_workspace_id from public.tags where id = old.tag_id;
    elsif tg_table_name = 'workflow_items' then
      select workspace_id into source_workspace_id from public.workflows where id = old.workflow_id;
      select workspace_id into related_workspace_id from public.documents where id = old.document_id;
      if old.extraction_id is not null then
        select workspace_id into optional_workspace_id from public.extractions where id = old.extraction_id;
      end if;
    else
      raise exception 'unsupported_workspace_join' using errcode = '55000';
    end if;
    perform public.assert_writable_workspace_relationship(
      source_workspace_id,
      related_workspace_id,
      optional_workspace_id
    );
  end if;

  source_workspace_id := null;
  related_workspace_id := null;
  optional_workspace_id := null;
  if tg_table_name = 'chat_documents' then
    select workspace_id into source_workspace_id from public.chats where id = new.chat_id;
    select workspace_id into related_workspace_id from public.documents where id = new.document_id;
  elsif tg_table_name = 'chat_messages' then
    select workspace_id into source_workspace_id from public.chats where id = new.chat_id;
    related_workspace_id := source_workspace_id;
  elsif tg_table_name = 'document_tags' then
    select workspace_id into source_workspace_id from public.documents where id = new.document_id;
    select workspace_id into related_workspace_id from public.tags where id = new.tag_id;
  elsif tg_table_name = 'workflow_items' then
    select workspace_id into source_workspace_id from public.workflows where id = new.workflow_id;
    select workspace_id into related_workspace_id from public.documents where id = new.document_id;
    if new.extraction_id is not null then
      select workspace_id into optional_workspace_id from public.extractions where id = new.extraction_id;
    end if;
  else
    raise exception 'unsupported_workspace_join' using errcode = '55000';
  end if;

  perform public.assert_writable_workspace_relationship(
    source_workspace_id,
    related_workspace_id,
    optional_workspace_id
  );

  return new;
end;
$$;

create trigger chat_documents_require_writable_workspace
  before insert or update on public.chat_documents
  for each row execute function public.reject_non_writable_join_change();
create trigger chat_messages_require_writable_workspace
  before insert or update on public.chat_messages
  for each row execute function public.reject_non_writable_join_change();
create trigger document_tags_require_writable_workspace
  before insert or update on public.document_tags
  for each row execute function public.reject_non_writable_join_change();
create trigger workflow_items_require_writable_workspace
  before insert or update on public.workflow_items
  for each row execute function public.reject_non_writable_join_change();

revoke all on function public.claim_workspace_deletion(uuid, uuid) from public, anon, authenticated;
revoke all on function public.renew_workspace_deletion(uuid, uuid) from public, anon, authenticated;
revoke all on function public.begin_workspace_destructive_deletion(uuid, uuid) from public, anon, authenticated;
revoke all on function public.pause_workspace_deletion(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_workspace_deletion(uuid, uuid) from public, anon, authenticated;
revoke all on function public.delete_claimed_workspace(uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_workspace_billing(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_workspace_checkout_session(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_workspace_billing(uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_document_deletion(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.pause_document_deletion(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.finalize_document_deletion(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.assert_writable_workspace_relationship(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.reject_non_writable_join_change() from public, anon, authenticated;

grant execute on function public.claim_workspace_deletion(uuid, uuid) to service_role;
grant execute on function public.renew_workspace_deletion(uuid, uuid) to service_role;
grant execute on function public.begin_workspace_destructive_deletion(uuid, uuid) to service_role;
grant execute on function public.pause_workspace_deletion(uuid, uuid) to service_role;
grant execute on function public.release_workspace_deletion(uuid, uuid) to service_role;
grant execute on function public.delete_claimed_workspace(uuid, uuid) to service_role;
grant execute on function public.claim_workspace_billing(uuid, uuid, text) to service_role;
grant execute on function public.record_workspace_checkout_session(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.release_workspace_billing(uuid, uuid) to service_role;
grant execute on function public.claim_document_deletion(uuid, uuid, uuid) to service_role;
grant execute on function public.pause_document_deletion(uuid, uuid, uuid) to service_role;
grant execute on function public.finalize_document_deletion(uuid, uuid, uuid, text) to service_role;
