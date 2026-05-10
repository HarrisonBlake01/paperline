-- =====================================================================
-- Paperline — service role grants (0006)
-- =====================================================================
-- The app's server-side routes use the Supabase service role key.
-- RLS may still apply for user JWT clients, but the service role must also
-- have underlying SQL privileges on tables, sequences, and functions.
-- =====================================================================

grant usage on schema public to service_role;
grant usage on schema storage to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

grant all privileges on all tables in schema storage to service_role;
grant all privileges on all sequences in schema storage to service_role;
grant all privileges on all routines in schema storage to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on routines to service_role;

alter default privileges in schema storage
  grant all on tables to service_role;
alter default privileges in schema storage
  grant all on sequences to service_role;
alter default privileges in schema storage
  grant all on routines to service_role;
