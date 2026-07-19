-- Paperline tenant-integrity and RLS hardening.
-- This migration is safe to apply after 0010_seed_community_templates.sql.

-- SECURITY DEFINER helpers must not inherit a caller-controlled search_path.
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.jwt() ->> 'sub'
  );
$$;

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.jwt() ->> 'sub'
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.is_workspace_admin(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function public.is_workspace_admin(uuid) to authenticated, service_role;

-- A document's optional folder must belong to the same workspace.
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents
  for all
  using (public.is_workspace_member(workspace_id))
  with check (
    public.is_workspace_member(workspace_id)
    and (
      folder_id is null
      or exists (
        select 1 from public.folders f
        where f.id = documents.folder_id
          and f.workspace_id = documents.workspace_id
      )
    )
  );

-- Join rows must keep both sides inside one tenant.
drop policy if exists document_tags_all on public.document_tags;
create policy document_tags_all on public.document_tags
  for all
  using (
    exists (
      select 1
      from public.documents d
      join public.tags t on t.id = document_tags.tag_id
      where d.id = document_tags.document_id
        and d.workspace_id = t.workspace_id
        and public.is_workspace_member(d.workspace_id)
    )
  )
  with check (
    exists (
      select 1
      from public.documents d
      join public.tags t on t.id = document_tags.tag_id
      where d.id = document_tags.document_id
        and d.workspace_id = t.workspace_id
        and public.is_workspace_member(d.workspace_id)
    )
  );

drop policy if exists chunks_write on public.document_chunks;
create policy chunks_write on public.document_chunks
  for all
  using (public.is_workspace_member(workspace_id))
  with check (
    public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.documents d
      where d.id = document_chunks.document_id
        and d.workspace_id = document_chunks.workspace_id
    )
  );

drop policy if exists extractions_write on public.extractions;
create policy extractions_write on public.extractions
  for all
  using (public.is_workspace_member(workspace_id))
  with check (
    public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.documents d
      where d.id = extractions.document_id
        and d.workspace_id = extractions.workspace_id
    )
    and exists (
      select 1 from public.templates t
      where t.id = extractions.template_id
        and (t.workspace_id is null or t.workspace_id = extractions.workspace_id)
    )
  );

drop policy if exists workflows_write on public.workflows;
create policy workflows_write on public.workflows
  for all
  using (public.is_workspace_member(workspace_id))
  with check (
    public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.templates t
      where t.id = workflows.template_id
        and (t.workspace_id is null or t.workspace_id = workflows.workspace_id)
    )
  );

drop policy if exists workflow_items_all on public.workflow_items;
create policy workflow_items_all on public.workflow_items
  for all
  using (
    exists (
      select 1
      from public.workflows w
      join public.documents d on d.id = workflow_items.document_id
      where w.id = workflow_items.workflow_id
        and w.workspace_id = d.workspace_id
        and public.is_workspace_member(w.workspace_id)
    )
  )
  with check (
    exists (
      select 1
      from public.workflows w
      join public.documents d on d.id = workflow_items.document_id
      where w.id = workflow_items.workflow_id
        and w.workspace_id = d.workspace_id
        and public.is_workspace_member(w.workspace_id)
    )
    and (
      extraction_id is null
      or exists (
        select 1 from public.extractions e
        join public.workflows w on w.id = workflow_items.workflow_id
        where e.id = workflow_items.extraction_id
          and e.workspace_id = w.workspace_id
          and e.document_id = workflow_items.document_id
      )
    )
  );

drop policy if exists chat_documents_all on public.chat_documents;
create policy chat_documents_all on public.chat_documents
  for all
  using (
    exists (
      select 1
      from public.chats c
      join public.documents d on d.id = chat_documents.document_id
      where c.id = chat_documents.chat_id
        and c.workspace_id = d.workspace_id
        and public.is_workspace_member(c.workspace_id)
    )
  )
  with check (
    exists (
      select 1
      from public.chats c
      join public.documents d on d.id = chat_documents.document_id
      where c.id = chat_documents.chat_id
        and c.workspace_id = d.workspace_id
        and public.is_workspace_member(c.workspace_id)
    )
  );
