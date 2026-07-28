\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role;
\i /repo/supabase/migrations/0001_init.sql
\i /repo/supabase/migrations/0012_workspace_rate_limits.sql
\i /repo/supabase/migrations/0014_workspace_lifecycle.sql
\i /repo/supabase/migrations/0015_workspace_operation_fencing.sql
\i /repo/supabase/migrations/0016_workspace_billing_claim.sql
\i /repo/supabase/migrations/0017_lifecycle_checkout_recovery.sql
\i /repo/supabase/migrations/0018_storage_cleanup_jobs.sql

DO $$
declare
  ws uuid := '00000000-0000-0000-0000-000000000101';
  owner_a uuid := '00000000-0000-0000-0000-000000000201';
  owner_b uuid := '00000000-0000-0000-0000-000000000202';
begin
  insert into public.workspaces(id, slug, name) values (ws, 'fence', 'Fence');
  if not public.claim_workspace_deletion(ws, owner_a) then raise exception 'owner A did not claim'; end if;
  if public.claim_workspace_deletion(ws, owner_b) then raise exception 'owner B stole claim'; end if;
  if public.release_workspace_deletion(ws, owner_b) then raise exception 'owner B released claim'; end if;
  if not public.pause_workspace_deletion(ws, owner_a) then raise exception 'owner A did not pause'; end if;
  if not public.claim_workspace_deletion(ws, owner_b) then raise exception 'owner B did not take stale claim'; end if;
  if public.release_workspace_deletion(ws, owner_a) then raise exception 'stale owner A released owner B claim'; end if;
  if not public.release_workspace_deletion(ws, owner_b) then raise exception 'owner B did not release'; end if;
end $$;

DO $$
declare
  ws uuid := '00000000-0000-0000-0000-000000000106';
  owner_a uuid := '00000000-0000-0000-0000-000000000203';
  owner_b uuid := '00000000-0000-0000-0000-000000000204';
begin
  insert into public.workspaces(id, slug, name) values (ws, 'destructive-fence', 'Destructive Fence');
  if not public.claim_workspace_deletion(ws, owner_a) then raise exception 'destructive owner A did not claim'; end if;
  if not public.begin_workspace_destructive_deletion(ws, owner_a) then raise exception 'point of no return was not recorded'; end if;
  if public.release_workspace_deletion(ws, owner_a) then raise exception 'destructive workspace was reactivated'; end if;
  if not public.pause_workspace_deletion(ws, owner_a) then raise exception 'destructive owner A did not pause'; end if;
  if not public.claim_workspace_deletion(ws, owner_b) then raise exception 'destructive owner B did not take stale claim'; end if;
  if public.renew_workspace_deletion(ws, owner_a) then raise exception 'stale destructive owner renewed'; end if;
  if not public.renew_workspace_deletion(ws, owner_b) then raise exception 'new destructive owner did not renew'; end if;
  if not public.begin_workspace_destructive_deletion(ws, owner_b) then raise exception 'new destructive owner could not resume point of no return'; end if;
  if public.release_workspace_deletion(ws, owner_b) then raise exception 'new destructive owner reactivated workspace'; end if;
  if not public.delete_claimed_workspace(ws, owner_b) then raise exception 'destructive owner did not finalize'; end if;
end $$;

DO $$
declare
  ws uuid := '00000000-0000-0000-0000-000000000102';
  op_a uuid := '00000000-0000-0000-0000-000000000211';
  op_b uuid := '00000000-0000-0000-0000-000000000212';
begin
  insert into public.workspaces(id, slug, name) values (ws, 'billing', 'Billing');
  if not public.claim_workspace_billing(ws, op_a, 'pro') then raise exception 'billing A did not claim'; end if;
  if public.claim_workspace_billing(ws, op_b, 'team') then raise exception 'billing B stole claim'; end if;
  update public.workspaces
    set lifecycle_state_changed_at = now() - interval '16 minutes'
    where id = ws;
  if not public.claim_workspace_billing(ws, op_a, 'pro') then raise exception 'stale billing A did not recover'; end if;
  if not public.record_workspace_checkout_session(ws, op_a, 'cus_fixture', 'cs_fixture', now() + interval '1 hour') then
    raise exception 'session was not recorded';
  end if;
  if not public.release_workspace_billing(ws, op_a) then raise exception 'billing A did not release'; end if;
  if public.claim_workspace_billing(ws, op_b, 'team') then raise exception 'new checkout bypassed pending session'; end if;
  update public.workspace_billing_operations set status = 'expired' where id = op_a;
  if not public.claim_workspace_billing(ws, op_b, 'team') then raise exception 'new checkout blocked after reconciliation'; end if;
  if public.release_workspace_billing(ws, op_a) then raise exception 'old billing owner released B'; end if;
  if not public.release_workspace_billing(ws, op_b) then raise exception 'billing B did not release'; end if;
end $$;

DO $$
declare
  ws uuid := '00000000-0000-0000-0000-000000000103';
  doc_a uuid := '00000000-0000-0000-0000-000000000301';
  doc_b uuid := '00000000-0000-0000-0000-000000000302';
  chat_fixture uuid := '00000000-0000-0000-0000-000000000401';
  orphan_chat_fixture uuid := '00000000-0000-0000-0000-000000000402';
  token_a uuid := '00000000-0000-0000-0000-000000000501';
  token_b uuid := '00000000-0000-0000-0000-000000000502';
begin
  insert into public.workspaces(id, slug, name) values (ws, 'documents', 'Documents');
  insert into public.documents(id, workspace_id, uploader_id, filename, storage_path, mime_type, size_bytes)
    values
      (doc_a, ws, 'user_fixture', 'a.txt', 'fixture/a.txt', 'text/plain', 1),
      (doc_b, ws, 'user_fixture', 'b.txt', 'fixture/b.txt', 'text/plain', 1);
  insert into public.chats(id, workspace_id, created_by) values
    (chat_fixture, ws, 'user_fixture'),
    (orphan_chat_fixture, ws, 'user_fixture');
  insert into public.chat_documents(chat_id, document_id) values
    (chat_fixture, doc_a),
    (chat_fixture, doc_b),
    (orphan_chat_fixture, doc_a);
  insert into public.workspace_operation_leases(workspace_id, token, kind, expires_at)
    values (ws, '00000000-0000-0000-0000-000000000599', 'upload', now() + interval '5 minutes');
  if public.claim_document_deletion(ws, doc_a, token_a) then raise exception 'document deletion bypassed active upload'; end if;
  delete from public.workspace_operation_leases where workspace_id = ws;
  if not public.claim_document_deletion(ws, doc_a, token_a) then raise exception 'document was not claimed'; end if;
  if not public.pause_document_deletion(ws, doc_a, token_a) then raise exception 'document was not paused'; end if;
  if not public.claim_document_deletion(ws, doc_a, token_b) then raise exception 'stale document was not reclaimed'; end if;
  if public.finalize_document_deletion(ws, doc_a, token_a, 'user_fixture') then raise exception 'stale document owner finalized'; end if;
  if not public.finalize_document_deletion(ws, doc_a, token_b, 'user_fixture') then raise exception 'document was not finalized'; end if;
  if exists(select 1 from public.documents where id = doc_a) then raise exception 'deleted document remains'; end if;
  if not exists(select 1 from public.documents where id = doc_b) then raise exception 'shared document was deleted'; end if;
  if not exists(select 1 from public.chats where id = chat_fixture) then raise exception 'shared chat was deleted'; end if;
  if exists(select 1 from public.chats where id = orphan_chat_fixture) then raise exception 'orphan chat remains'; end if;
  if not exists(select 1 from public.chat_documents where chat_id = chat_fixture and document_id = doc_b) then
    raise exception 'shared chat link was deleted';
  end if;
  if not exists(
    select 1 from public.audit_logs
    where target_id = doc_a and metadata @> jsonb_build_object('operation_token', token_b)
  ) then raise exception 'replay audit marker missing'; end if;
end $$;

DO $$
declare
  source_ws uuid := '00000000-0000-0000-0000-000000000104';
  target_ws uuid := '00000000-0000-0000-0000-000000000105';
  doc_id uuid := '00000000-0000-0000-0000-000000000303';
  related_doc_id uuid := '00000000-0000-0000-0000-000000000304';
  chat_fixture uuid := '00000000-0000-0000-0000-000000000403';
  token uuid := '00000000-0000-0000-0000-000000000503';
  move_rejected boolean := false;
  join_rejected boolean := false;
begin
  insert into public.workspaces(id, slug, name) values
    (source_ws, 'source', 'Source'), (target_ws, 'target', 'Target');
  insert into public.documents(id, workspace_id, uploader_id, filename, storage_path, mime_type, size_bytes)
    values
      (doc_id, source_ws, 'user_fixture', 'move.txt', 'fixture/move.txt', 'text/plain', 1),
      (related_doc_id, source_ws, 'user_fixture', 'join.txt', 'fixture/join.txt', 'text/plain', 1);
  insert into public.chats(id, workspace_id, created_by)
    values (chat_fixture, source_ws, 'user_fixture');
  perform public.claim_workspace_deletion(source_ws, token);
  begin
    update public.documents set workspace_id = target_ws where id = doc_id;
  exception when sqlstate '55000' then
    move_rejected := true;
  end;
  if not move_rejected then raise exception 'move out of deleting workspace was allowed'; end if;
  begin
    insert into public.chat_documents(chat_id, document_id)
      values (chat_fixture, related_doc_id);
  exception when sqlstate '55000' then
    join_rejected := true;
  end;
  if not join_rejected then raise exception 'join write in deleting workspace was allowed'; end if;
end $$;

DO $$
declare
  ws uuid := '00000000-0000-0000-0000-000000000107';
begin
  if has_table_privilege('authenticated', 'public.storage_cleanup_jobs', 'select') then
    raise exception 'authenticated role can read internal cleanup jobs';
  end if;
  if not has_table_privilege('service_role', 'public.storage_cleanup_jobs', 'insert') then
    raise exception 'service role cannot register cleanup jobs';
  end if;
  insert into public.workspaces(id, slug, name) values (ws, 'cleanup-jobs', 'Cleanup Jobs');
  insert into public.storage_cleanup_jobs(
    workspace_id, document_id, bucket, storage_path
  ) values (
    ws,
    '00000000-0000-0000-0000-000000000305',
    'documents',
    'fixture/orphan.txt'
  );
  delete from public.workspaces where id = ws;
  if exists(select 1 from public.storage_cleanup_jobs where workspace_id = ws) then
    raise exception 'workspace cleanup job did not cascade';
  end if;
end $$;

select 'lifecycle-db-regressions-pass' as result;
