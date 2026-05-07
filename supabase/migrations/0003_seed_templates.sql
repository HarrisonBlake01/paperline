-- =====================================================================
-- Paperline — built-in templates seed (0003)
-- =====================================================================
-- These are workspace_id = NULL → readable by everyone signed in.
-- =====================================================================

insert into templates (id, workspace_id, name, description, doc_type, schema, is_builtin)
values
-- ---------- INVOICE ----------
(
  '00000000-0000-0000-0000-000000000001',
  null,
  'Invoice',
  'Extract vendor, totals, and line items from a standard invoice.',
  'invoice',
  '{
    "fields": [
      {"name":"vendor_name","type":"text","required":true,"description":"The company sending the invoice."},
      {"name":"vendor_address","type":"text","required":false,"description":"Vendor mailing address."},
      {"name":"invoice_number","type":"text","required":true},
      {"name":"invoice_date","type":"date","required":true},
      {"name":"due_date","type":"date","required":false},
      {"name":"currency","type":"text","required":true,"description":"ISO 4217 code, e.g. USD"},
      {"name":"subtotal","type":"currency","required":true},
      {"name":"tax","type":"currency","required":false},
      {"name":"total","type":"currency","required":true},
      {"name":"line_items","type":"list","required":true,"description":"Array of {description, quantity, unit_price, amount}."}
    ]
  }'::jsonb,
  true
),
-- ---------- CONTRACT ----------
(
  '00000000-0000-0000-0000-000000000002',
  null,
  'Contract',
  'Pull parties, dates, payment terms, and key clauses from a contract.',
  'contract',
  '{
    "fields": [
      {"name":"parties","type":"list","required":true,"description":"All parties to the agreement."},
      {"name":"effective_date","type":"date","required":true},
      {"name":"term","type":"text","required":false,"description":"Initial term, e.g. 12 months."},
      {"name":"renewal","type":"text","required":false},
      {"name":"payment_terms","type":"text","required":false},
      {"name":"governing_law","type":"text","required":false},
      {"name":"termination_clause","type":"text","required":false},
      {"name":"confidentiality","type":"boolean","required":false},
      {"name":"key_obligations","type":"list","required":false,"description":"Material obligations of each party."},
      {"name":"risk_flags","type":"list","required":false,"description":"Unusual or high-risk clauses worth review."}
    ]
  }'::jsonb,
  true
),
-- ---------- RESUME ----------
(
  '00000000-0000-0000-0000-000000000003',
  null,
  'Resume',
  'Extract candidate summary, skills, experience, and education.',
  'resume',
  '{
    "fields": [
      {"name":"full_name","type":"text","required":true},
      {"name":"email","type":"text","required":false},
      {"name":"phone","type":"text","required":false},
      {"name":"location","type":"text","required":false},
      {"name":"summary","type":"text","required":false},
      {"name":"skills","type":"list","required":false},
      {"name":"experience","type":"list","required":true,"description":"Array of {company, title, start_date, end_date, bullets}."},
      {"name":"education","type":"list","required":false,"description":"Array of {school, degree, field, year}."},
      {"name":"links","type":"list","required":false,"description":"LinkedIn, GitHub, portfolio, etc."}
    ]
  }'::jsonb,
  true
),
-- ---------- REPORT ----------
(
  '00000000-0000-0000-0000-000000000004',
  null,
  'Report',
  'Summarize a long report into title, executive summary, and key findings.',
  'report',
  '{
    "fields": [
      {"name":"title","type":"text","required":true},
      {"name":"author","type":"text","required":false},
      {"name":"published_date","type":"date","required":false},
      {"name":"executive_summary","type":"text","required":true},
      {"name":"key_findings","type":"list","required":true},
      {"name":"recommendations","type":"list","required":false},
      {"name":"entities","type":"list","required":false,"description":"Companies, people, places mentioned."},
      {"name":"timeframe","type":"text","required":false}
    ]
  }'::jsonb,
  true
);
