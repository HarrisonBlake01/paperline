-- =====================================================================
-- Paperline — Row Level Security policies (0002)
-- =====================================================================
-- Auth model:
--   Clerk issues a JWT. Supabase verifies it (JWT secret = Clerk JWKS).
--   The Clerk user id arrives in `auth.jwt() ->> 'sub'`.
--   A user can read/write a row only if they're a member of the workspace.
-- =====================================================================

-- Helper: is the caller a member of this workspace?
create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
     where workspace_id = ws_id
       and user_id = auth.jwt() ->> 'sub'
  );
$$;

-- Helper: is the caller an admin or owner of this workspace?
create or replace function is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
     where workspace_id = ws_id
       and user_id = auth.jwt() ->> 'sub'
       and role in ('owner','admin')
  );
$$;

-- Enable RLS on every tenant table
alter table workspaces         enable row level security;
alter table workspace_members  enable row level security;
alter table folders            enable row level security;
alter table documents          enable row level security;
alter table tags               enable row level security;
alter table document_tags      enable row level security;
alter table document_chunks    enable row level security;
alter table templates          enable row level security;
alter table extractions        enable row level security;
alter table workflows          enable row level security;
alter table workflow_items     enable row level security;
alter table chats              enable row level security;
alter table chat_documents     enable row level security;
alter table chat_messages      enable row level security;
alter table api_keys           enable row level security;
alter table audit_logs         enable row level security;
alter table usage_events       enable row level security;

-- =====================================================================
-- Workspaces — members can read their workspaces
-- =====================================================================
create policy ws_select on workspaces
  for select using (is_workspace_member(id));

create policy ws_update on workspaces
  for update using (is_workspace_admin(id));

-- Inserts/deletes happen server-side via service role only.

-- =====================================================================
-- Workspace members
-- =====================================================================
create policy wm_select on workspace_members
  for select using (is_workspace_member(workspace_id));

create policy wm_modify on workspace_members
  for all using (is_workspace_admin(workspace_id));

-- =====================================================================
-- Generic tenant-scoped tables
-- =====================================================================

-- folders
create policy folders_select on folders for select using (is_workspace_member(workspace_id));
create policy folders_write  on folders for all    using (is_workspace_member(workspace_id));

-- documents
create policy documents_select on documents for select using (is_workspace_member(workspace_id));
create policy documents_write  on documents for all    using (is_workspace_member(workspace_id));

-- tags
create policy tags_select on tags for select using (is_workspace_member(workspace_id));
create policy tags_write  on tags for all    using (is_workspace_member(workspace_id));

-- document_tags (joined via documents.workspace_id)
create policy document_tags_all on document_tags
  for all using (
    exists (
      select 1 from documents d
       where d.id = document_tags.document_id
         and is_workspace_member(d.workspace_id)
    )
  );

-- document_chunks
create policy chunks_select on document_chunks for select using (is_workspace_member(workspace_id));
create policy chunks_write  on document_chunks for all    using (is_workspace_member(workspace_id));

-- templates: built-ins (workspace_id IS NULL) are readable by everyone signed in
create policy templates_select on templates
  for select using (workspace_id is null or is_workspace_member(workspace_id));
create policy templates_write on templates
  for all using (workspace_id is not null and is_workspace_member(workspace_id));

-- extractions
create policy extractions_select on extractions for select using (is_workspace_member(workspace_id));
create policy extractions_write  on extractions for all    using (is_workspace_member(workspace_id));

-- workflows
create policy workflows_select on workflows for select using (is_workspace_member(workspace_id));
create policy workflows_write  on workflows for all    using (is_workspace_member(workspace_id));

create policy workflow_items_all on workflow_items
  for all using (
    exists (
      select 1 from workflows w
       where w.id = workflow_items.workflow_id
         and is_workspace_member(w.workspace_id)
    )
  );

-- chats
create policy chats_select on chats for select using (is_workspace_member(workspace_id));
create policy chats_write  on chats for all    using (is_workspace_member(workspace_id));

create policy chat_documents_all on chat_documents
  for all using (
    exists (select 1 from chats c where c.id = chat_documents.chat_id and is_workspace_member(c.workspace_id))
  );

create policy chat_messages_all on chat_messages
  for all using (
    exists (select 1 from chats c where c.id = chat_messages.chat_id and is_workspace_member(c.workspace_id))
  );

-- api_keys (admins only)
create policy api_keys_select on api_keys for select using (is_workspace_admin(workspace_id));
create policy api_keys_write  on api_keys for all    using (is_workspace_admin(workspace_id));

-- audit_logs (admins read; writes via service role)
create policy audit_logs_select on audit_logs for select using (is_workspace_admin(workspace_id));

-- usage_events (members can read; writes via service role)
create policy usage_events_select on usage_events for select using (is_workspace_member(workspace_id));
