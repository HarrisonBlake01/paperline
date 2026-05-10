-- =====================================================================
-- Paperline — storage bucket bootstrap (0005)
-- =====================================================================
-- Create the private documents bucket used for uploads if it does not exist.
-- Upload/download flows currently use the service-role client on the server.
-- =====================================================================

insert into storage.buckets (id, name, public)
select 'documents', 'documents', false
where not exists (
  select 1 from storage.buckets where id = 'documents'
);
