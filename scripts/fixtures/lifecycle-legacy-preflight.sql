\set ON_ERROR_STOP on
DO $$ begin if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if; end $$;
DO $$ begin if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if; end $$;
DO $$ begin if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if; end $$;
\i /repo/supabase/migrations/0001_init.sql
\i /repo/supabase/migrations/0012_workspace_rate_limits.sql
\i /repo/supabase/migrations/0014_workspace_lifecycle.sql
\i /repo/supabase/migrations/0015_workspace_operation_fencing.sql
\i /repo/supabase/migrations/0016_workspace_billing_claim.sql

insert into public.workspaces(id, slug, name)
values ('00000000-0000-0000-0000-000000000199', 'legacy-deleting', 'Legacy Deleting');

select public.claim_workspace_deletion('00000000-0000-0000-0000-000000000199');
