-- Scoped credentials for Paperline's authenticated remote MCP surface.
-- Existing API keys remain unusable for MCP until an administrator rotates them:
-- they receive no scopes and no expiry during this migration.

alter table public.api_keys
  add column if not exists scopes text[] not null default '{}'::text[],
  add column if not exists expires_at timestamptz;

alter table public.api_keys
  drop constraint if exists api_keys_scopes_allowed;

alter table public.api_keys
  add constraint api_keys_scopes_allowed check (
    cardinality(scopes) <= 8
    and scopes <@ array[
      'documents:read',
      'templates:read',
      'extractions:read',
      'extractions:write'
    ]::text[]
  );

create unique index if not exists api_keys_key_hash_unique_idx
  on public.api_keys(key_hash);

create index if not exists api_keys_active_expiry_idx
  on public.api_keys(workspace_id, expires_at)
  where revoked_at is null;

comment on column public.api_keys.key_hash is
  'SHA-256 digest of a cryptographically random high-entropy bearer credential.';
comment on column public.api_keys.scopes is
  'Server-enforced Paperline API/MCP scopes. Empty means the credential has no access.';
comment on column public.api_keys.expires_at is
  'Required by the Paperline MCP authenticator; null credentials are rejected.';
