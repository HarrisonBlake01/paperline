-- =====================================================================
-- Paperline — initial schema (0001)
-- =====================================================================
-- Conventions:
--   * Every tenant table has a workspace_id and an RLS policy keyed on it.
--   * UUIDs everywhere. timestamps in UTC.
--   * snake_case.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- =====================================================================
-- Workspaces & members (tenant root)
-- =====================================================================

create table workspaces (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  logo_url        text,
  plan            text not null default 'free' check (plan in ('free','pro','team','enterprise')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  pages_used_this_period int not null default 0,
  pages_limit     int not null default 50,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table workspace_members (
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  user_id         text not null,                      -- Clerk user id (string)
  role            text not null check (role in ('owner','admin','member')),
  invited_email   text,
  joined_at       timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on workspace_members(user_id);

-- =====================================================================
-- Folders / collections
-- =====================================================================

create table folders (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  color           text,
  created_by      text not null,
  created_at      timestamptz not null default now()
);

create index folders_workspace_idx on folders(workspace_id);

-- =====================================================================
-- Documents
-- =====================================================================

create table documents (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  folder_id       uuid references folders(id) on delete set null,
  uploader_id     text not null,
  filename        text not null,
  storage_path    text not null,                       -- key in supabase storage
  mime_type       text not null,
  size_bytes      bigint not null,
  page_count      int,
  doc_type        text check (doc_type in ('invoice','contract','resume','report','other')),
  status          text not null default 'queued' check (status in ('queued','processing','ready','failed')),
  error_message   text,
  text_content    text,                                 -- raw extracted text (full)
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index documents_workspace_idx on documents(workspace_id);
create index documents_folder_idx on documents(folder_id);
create index documents_status_idx on documents(status);
create index documents_doc_type_idx on documents(doc_type);

-- Tags (many-to-many)
create table tags (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  color           text,
  unique (workspace_id, name)
);

create table document_tags (
  document_id     uuid not null references documents(id) on delete cascade,
  tag_id          uuid not null references tags(id) on delete cascade,
  primary key (document_id, tag_id)
);

-- =====================================================================
-- Chunks + embeddings (pgvector)
-- =====================================================================

create table document_chunks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  document_id     uuid not null references documents(id) on delete cascade,
  chunk_index     int not null,
  page_number     int,
  text            text not null,
  token_count     int,
  embedding       vector(3072),                          -- text-embedding-3-large
  created_at      timestamptz not null default now()
);

create index document_chunks_doc_idx on document_chunks(document_id);
create index document_chunks_workspace_idx on document_chunks(workspace_id);
-- NOTE: Intentionally skipping an ANN index here for launch.
-- This Supabase pgvector instance rejects HNSW indexes on 3072-dimension
-- `vector` columns. We can add a compatible index later after either
-- reducing dimensions or switching index/type strategy.

-- =====================================================================
-- Extraction templates + runs
-- =====================================================================

create table templates (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,  -- null = built-in
  name            text not null,
  description     text,
  doc_type        text not null,                          -- target doc_type (invoice, contract, etc.)
  schema          jsonb not null,                         -- field definitions
  is_builtin      boolean not null default false,
  created_by      text,
  created_at      timestamptz not null default now()
);

create index templates_workspace_idx on templates(workspace_id);
create index templates_doctype_idx on templates(doc_type);

create table extractions (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  document_id     uuid not null references documents(id) on delete cascade,
  template_id     uuid not null references templates(id),
  status          text not null default 'queued' check (status in ('queued','processing','succeeded','failed')),
  result          jsonb,                                  -- { fields: { name: { value, confidence } } }
  user_corrections jsonb,                                 -- field-level corrections
  model           text,
  prompt_tokens   int,
  completion_tokens int,
  cost_cents      int,
  error_message   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index extractions_document_idx on extractions(document_id);
create index extractions_workspace_idx on extractions(workspace_id);

-- =====================================================================
-- Workflows (batch runs)
-- =====================================================================

create table workflows (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  template_id     uuid not null references templates(id),
  status          text not null default 'pending' check (status in ('pending','running','completed','failed')),
  total_count     int not null default 0,
  succeeded_count int not null default 0,
  failed_count    int not null default 0,
  created_by      text not null,
  created_at      timestamptz not null default now()
);

create table workflow_items (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     uuid not null references workflows(id) on delete cascade,
  document_id     uuid not null references documents(id) on delete cascade,
  extraction_id   uuid references extractions(id),
  status          text not null default 'pending' check (status in ('pending','running','succeeded','failed')),
  error_message   text
);

create index workflow_items_workflow_idx on workflow_items(workflow_id);

-- =====================================================================
-- Chats
-- =====================================================================

create table chats (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  title           text,
  created_by      text not null,
  created_at      timestamptz not null default now()
);

create table chat_documents (
  chat_id         uuid not null references chats(id) on delete cascade,
  document_id     uuid not null references documents(id) on delete cascade,
  primary key (chat_id, document_id)
);

create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  chat_id         uuid not null references chats(id) on delete cascade,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  citations       jsonb,                                  -- [{ chunk_id, page, snippet }]
  created_at      timestamptz not null default now()
);

create index chat_messages_chat_idx on chat_messages(chat_id, created_at);

-- =====================================================================
-- API keys
-- =====================================================================

create table api_keys (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  prefix          text not null,                          -- e.g. "pl_live_a1b2"
  key_hash        text not null,                          -- bcrypt/argon2 hash
  last_used_at    timestamptz,
  created_by      text not null,
  created_at      timestamptz not null default now(),
  revoked_at      timestamptz
);

create index api_keys_workspace_idx on api_keys(workspace_id);

-- =====================================================================
-- Audit log
-- =====================================================================

create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  actor_user_id   text,
  action          text not null,                          -- e.g. 'document.uploaded'
  target_type     text,
  target_id       uuid,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index audit_logs_workspace_idx on audit_logs(workspace_id, created_at desc);

-- =====================================================================
-- Usage events (page meter)
-- =====================================================================

create table usage_events (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  kind            text not null check (kind in ('pages','tokens','storage')),
  amount          int not null,
  cost_cents      int,
  reference_id    uuid,                                   -- doc, extraction, etc.
  created_at      timestamptz not null default now()
);

create index usage_events_workspace_idx on usage_events(workspace_id, created_at desc);

-- =====================================================================
-- Helpers
-- =====================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_workspaces_updated   before update on workspaces   for each row execute function set_updated_at();
create trigger trg_documents_updated    before update on documents    for each row execute function set_updated_at();
create trigger trg_extractions_updated  before update on extractions  for each row execute function set_updated_at();
