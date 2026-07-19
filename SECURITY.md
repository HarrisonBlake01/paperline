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
- Upload content is checked against bounded file signatures/content rules before parsing.
- Stripe uses test keys by default; live mode requires explicit configuration.
- Public API failures use stable error codes instead of raw provider/database messages.
- Application responses set baseline clickjacking, MIME, referrer, permissions, and opener protections.

## Sensitive Document Handling

Paperline should be operated as a private-by-default document system:

- Do not commit real documents, PHI, legal records, customer files, or API credentials to this repository.
- Do not print document contents, credentials, service-role keys, or model prompts into logs.
- Use least-privilege credentials in production services.
- Rotate credentials immediately if any secret is suspected to be exposed.
- Review Supabase RLS policies before production deployment.

## Compliance Status

Paperline applies sensitive-document threat modeling and access-control practices as engineering safeguards. Formal compliance requires additional work, including but not limited to:

- signed BAAs/vendor agreements where applicable
- production access controls and audit review procedures
- documented incident response
- data retention/deletion policy
- encryption/key-management review
- penetration testing/security review
- compliance-specific deployment configuration

Do not market or represent Paperline as HIPAA-compliant, SOC 2-compliant, or legally certified until those requirements have been completed and verified.

## Responsible Disclosure

Report security issues privately to the project owner:

```text
harrison@olveraproductions.com
```

When reporting an issue, include:

- affected route or feature
- steps to reproduce
- expected vs. actual behavior
- whether document data, credentials, or cross-workspace access may be involved

Do not send live credentials, real customer documents, PHI, legal records, or destructive proof-of-concept payloads. Use synthetic data and the minimum safe reproduction necessary.

## Incident Handling

For a suspected credential or cross-workspace incident:

1. Disable the affected integration or route and preserve bounded logs/audit metadata.
2. Rotate provider credentials and invalidate affected sessions/API keys.
3. Determine affected workspaces and data types without copying document content into tickets.
4. Restore service through a reviewed forward fix or known-good Vercel deployment.
5. Document the timeline, scope, remediation, and required user/provider notifications.

Formal on-call targets, notification timelines, and compliance-specific incident procedures remain pre-launch work.

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
- [ ] Apply and negative-test migrations `0011_security_hardening.sql` and `0012_workspace_rate_limits.sql`.
- [ ] Verify per-workspace rate limits plus atomic page/token usage reservations for OCR and AI operations.
- [ ] Stage a production-domain CSP in report-only mode, then enforce after review.
- [ ] Verify production Clerk keys, canonical domain, redirects, and webhook endpoints.

See [`docs/security/threat-model.md`](./docs/security/threat-model.md), [`docs/security/security-audit.md`](./docs/security/security-audit.md), and [`docs/release/production-readiness.md`](./docs/release/production-readiness.md) for the current evidence and go/no-go decision.
