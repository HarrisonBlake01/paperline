-- =====================================================================
-- Paperline — starter community templates (0010)
-- =====================================================================
-- Gives the community library useful examples on a fresh project so users
-- can browse/copy templates before organic publishing activity exists.
-- These templates are global (workspace_id = null), not built-in, and can
-- be copied into a workspace via the community template flow.
-- =====================================================================

insert into templates (
  id,
  workspace_id,
  name,
  description,
  doc_type,
  schema,
  is_builtin,
  is_community,
  published_by,
  published_at,
  upvotes_count,
  uses_count
)
values
(
  '00000000-0000-0000-0000-000000000101',
  null,
  'Client Intake Packet',
  'Capture contact details, requested services, deadlines, and open questions from intake forms.',
  'form',
  '{
    "fields": [
      {"name":"client_name","type":"text","required":true,"description":"The person or company requesting service."},
      {"name":"contact_email","type":"text","required":false,"description":"Primary email address for follow-up."},
      {"name":"requested_services","type":"list","required":true,"description":"Services or deliverables the client is requesting."},
      {"name":"deadline","type":"date","required":false,"description":"Requested deadline or target date."},
      {"name":"budget","type":"currency","required":false,"description":"Any stated budget or estimated budget."},
      {"name":"open_questions","type":"list","required":false,"description":"Questions or missing information that need follow-up."}
    ]
  }'::jsonb,
  false,
  true,
  'paperline_seed',
  now(),
  18,
  42
),
(
  '00000000-0000-0000-0000-000000000102',
  null,
  'Purchase Order',
  'Extract buyer, supplier, PO number, delivery terms, totals, and line items.',
  'form',
  '{
    "fields": [
      {"name":"po_number","type":"text","required":true,"description":"Purchase order identifier."},
      {"name":"buyer_name","type":"text","required":true,"description":"Purchasing company or department."},
      {"name":"supplier_name","type":"text","required":true,"description":"Vendor or supplier fulfilling the order."},
      {"name":"order_date","type":"date","required":false},
      {"name":"delivery_date","type":"date","required":false},
      {"name":"total","type":"currency","required":true},
      {"name":"line_items","type":"list","required":true,"description":"Array of {sku, description, quantity, unit_price, amount}."}
    ]
  }'::jsonb,
  false,
  true,
  'paperline_seed',
  now(),
  15,
  36
),
(
  '00000000-0000-0000-0000-000000000103',
  null,
  'Lease Agreement',
  'Pull parties, property, term, rent, deposits, renewal, and notice requirements from leases.',
  'agreement',
  '{
    "fields": [
      {"name":"landlord","type":"text","required":true},
      {"name":"tenant","type":"text","required":true},
      {"name":"property_address","type":"text","required":true},
      {"name":"lease_start","type":"date","required":true},
      {"name":"lease_end","type":"date","required":false},
      {"name":"monthly_rent","type":"currency","required":true},
      {"name":"security_deposit","type":"currency","required":false},
      {"name":"renewal_terms","type":"text","required":false},
      {"name":"notice_requirements","type":"text","required":false}
    ]
  }'::jsonb,
  false,
  true,
  'paperline_seed',
  now(),
  21,
  51
),
(
  '00000000-0000-0000-0000-000000000104',
  null,
  'Meeting Notes',
  'Summarize decisions, owners, action items, deadlines, and unresolved risks from notes.',
  'note',
  '{
    "fields": [
      {"name":"meeting_title","type":"text","required":true},
      {"name":"meeting_date","type":"date","required":false},
      {"name":"attendees","type":"list","required":false},
      {"name":"decisions","type":"list","required":true,"description":"Decisions made during the meeting."},
      {"name":"action_items","type":"list","required":true,"description":"Array of {task, owner, due_date}."},
      {"name":"risks_or_blockers","type":"list","required":false},
      {"name":"follow_up_questions","type":"list","required":false}
    ]
  }'::jsonb,
  false,
  true,
  'paperline_seed',
  now(),
  12,
  27
),
(
  '00000000-0000-0000-0000-000000000105',
  null,
  'Medical Bill',
  'Extract provider, patient, dates of service, charges, insurance adjustments, and amount due.',
  'invoice',
  '{
    "fields": [
      {"name":"provider_name","type":"text","required":true},
      {"name":"patient_name","type":"text","required":false},
      {"name":"account_number","type":"text","required":false},
      {"name":"service_dates","type":"list","required":false},
      {"name":"insurance_adjustments","type":"currency","required":false},
      {"name":"amount_due","type":"currency","required":true},
      {"name":"due_date","type":"date","required":false},
      {"name":"billing_questions_phone","type":"text","required":false}
    ]
  }'::jsonb,
  false,
  true,
  'paperline_seed',
  now(),
  9,
  18
),
(
  '00000000-0000-0000-0000-000000000106',
  null,
  'Security Questionnaire',
  'Capture vendor security answers, compliance claims, evidence links, and follow-up gaps.',
  'form',
  '{
    "fields": [
      {"name":"vendor_name","type":"text","required":true},
      {"name":"questionnaire_date","type":"date","required":false},
      {"name":"compliance_frameworks","type":"list","required":false,"description":"SOC 2, ISO 27001, HIPAA, GDPR, etc."},
      {"name":"data_handling_summary","type":"text","required":false},
      {"name":"security_controls","type":"list","required":true},
      {"name":"evidence_links","type":"list","required":false},
      {"name":"follow_up_gaps","type":"list","required":false,"description":"Missing or ambiguous answers needing review."}
    ]
  }'::jsonb,
  false,
  true,
  'paperline_seed',
  now(),
  17,
  31
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  doc_type = excluded.doc_type,
  schema = excluded.schema,
  is_builtin = excluded.is_builtin,
  is_community = excluded.is_community,
  published_by = excluded.published_by,
  published_at = coalesce(templates.published_at, excluded.published_at),
  upvotes_count = greatest(templates.upvotes_count, excluded.upvotes_count),
  uses_count = greatest(templates.uses_count, excluded.uses_count);
