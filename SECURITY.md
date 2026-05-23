# Security Policy

Paperline is designed for sensitive document workflows. This repository is currently prepared for mentor/demo review and does **not** claim formal HIPAA, SOC 2, or legal compliance certification yet.

## Current Security Posture

Paperline is built around these safeguards:

- Clerk-authenticated access for app routes and protected API handlers.
- Workspace-scoped document, extraction, workflow, template, and API-key access checks.
- Supabase Row Level Security policies in the database migrations.
- Supabase Storage paths scoped by workspace and document IDs.
- Service-role Supabase usage limited to server-side code.
- API keys are generated once, stored as SHA-256 hashes, and only prefixes are retained for display.
- `.env`, `.env.local`, and environment-specific local files are ignored by git.
- Uploaded documents are treated as private workspace data.

## Sensitive Document Handling

Paperline should be operated as a private-by-default document system:

- Do not commit real documents, PHI, legal records, customer files, or API credentials to this repository.
- Do not print document contents, credentials, service-role keys, or model prompts into logs.
- Use least-privilege credentials in production services.
- Rotate credentials immediately if any secret is suspected to be exposed.
- Review Supabase RLS policies before production deployment.

## Compliance Status

Paperline is built with HIPAA-like/legal-document-grade care as an engineering standard for this demo. Formal compliance requires additional work, including but not limited to:

- signed BAAs/vendor agreements where applicable
- production access controls and audit review procedures
- documented incident response
- data retention/deletion policy
- encryption/key-management review
- penetration testing/security review
- compliance-specific deployment configuration

Do not market or represent Paperline as HIPAA-compliant, SOC 2-compliant, or legally certified until those requirements have been completed and verified.

## Responsible Disclosure

For mentor/demo review, report security issues directly to the project owner. Before public launch, replace this section with a monitored security contact such as:

```text
security@paperline.io
```

When reporting an issue, include:

- affected route or feature
- steps to reproduce
- expected vs. actual behavior
- whether document data, credentials, or cross-workspace access may be involved

## Pre-Deployment Security Checklist

Before live deployment:

- [ ] Run lint/build/tests.
- [ ] Run a tracked-file secret scan.
- [ ] Verify all document/workflow/template/API-key routes enforce auth and workspace ownership.
- [ ] Confirm `.env.local` and provider credentials are not tracked.
- [ ] Review Supabase RLS policies against real production roles.
- [ ] Confirm storage buckets are private and served only through authorized server-side paths.
- [ ] Review logging for document content, keys, prompts, and raw provider errors.
- [ ] Add production incident response and deletion/retention documentation.
