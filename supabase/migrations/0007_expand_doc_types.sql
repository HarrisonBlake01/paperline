-- Expand the allowed doc_type values to better cover real uploads.
-- Categories chosen to be common-sense, mutually exclusive enough for an LLM,
-- and easy to extend later.

alter table documents drop constraint if exists documents_doc_type_check;

alter table documents add constraint documents_doc_type_check
  check (
    doc_type in (
      'invoice',
      'receipt',
      'contract',
      'agreement',
      'resume',
      'report',
      'letter',
      'email',
      'memo',
      'form',
      'manual',
      'worksheet',
      'presentation',
      'spreadsheet',
      'note',
      'other'
    )
  );
