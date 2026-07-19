# Paperline production release checklist

## Decision

**Current decision: NO-GO for unrestricted public SaaS launch.**  
**Controlled recruiter/demo preview: GO once final local gates are green.**

No production deployment, push, migration, DNS change, webhook change, real Stripe action, or public post is authorized by this document.

## Canonical environment model

Names only—never record values in this file.

### Required for the real SaaS path

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### Required when features are enabled

- `CLERK_WEBHOOK_SECRET`
- `SUPABASE_BUCKET_DOCUMENTS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `PAPERLINE_ALLOW_LIVE_STRIPE`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_TEAM_MONTHLY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

### Optional/observability/background paths

- OCR/model tuning variables listed in `.env.example`
- Sentry variables
- PostHog variables
- Inngest variables
- demo workspace variables

## Pre-deployment blockers

- [ ] Choose canonical domain: current verified alias or `paperline.io`.
- [ ] Set `NEXT_PUBLIC_APP_URL` to that exact HTTPS origin.
- [ ] Replace Clerk development keys with production keys and configure allowed origins/redirects.
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is the project root, not `/rest/v1`.
- [ ] Confirm document bucket is private.
- [ ] Review and apply migrations `0011_security_hardening.sql` and `0012_workspace_rate_limits.sql` in order.
- [ ] Run two-workspace negative RLS/API tests.
- [ ] Exercise durable per-workspace limits and verify fail-closed, 429, and `Retry-After` behavior.
- [ ] Stage and validate CSP report-only policy, then enforce it.
- [ ] Confirm Stripe remains test mode; `PAPERLINE_ALLOW_LIVE_STRIPE=false`.
- [ ] Configure correct Clerk and Stripe production webhook URLs/secrets.
- [ ] Complete the synthetic signed-in QA matrix.
- [ ] Deploy to a non-production candidate and run representative PDF, scanned PDF, DOCX, TXT, PNG, and JPEG processing smoke tests.
- [ ] Add monitored dependency readiness; `/api/health` is liveness-only and must not be used as processing-readiness evidence.
- [ ] Verify retention/deletion, backup/restore, monitoring, alert ownership, and incident procedure.
- [ ] Run final secret/history scan and review every diff.

## Clean build and release gates

Use Node 22.x and pnpm 10.33.4 as pinned in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm test:templates
pnpm test:extraction-eval
pnpm test:demo
pnpm test:security
pnpm test:readiness
pnpm test:parser-runtime
pnpm lint
pnpm build
pnpm audit --prod --audit-level=high
git diff --check
```

The build route table must include the real app APIs/pages, `/contact`, legal/status/changelog pages, and `/ops-agent`.

## Approved-deploy procedure

Only after explicit approval:

1. Capture pre-deploy production URL/deployment ID for rollback.
2. Confirm Vercel environment names and target scopes without printing values.
3. Apply approved database migrations before code only when backward-compatible; otherwise use an expand/migrate/contract sequence.
4. Run `vercel --prod --yes` once.
5. Capture immutable deployment URL and public alias.
6. Inspect `vercel inspect <deployment-url> --logs` and require Ready.
7. Verify by HTTP and browser:
   - `/`, `/contact`, `/terms`, `/privacy`, `/status`, `/changelog`, `/ops-agent`
   - `/api/health` has safe shape and `no-store`
   - `/dashboard` and `/documents` redirect signed-out users to `/sign-in`
   - security headers exist and `X-Powered-By` is absent
   - no JavaScript console errors
8. Run the synthetic signed-in smoke journey with test-mode providers.
9. Record deploy evidence in the release report—never secrets.

## Rollback

1. Use Vercel's previous known-good deployment/instant rollback for code.
2. Do not roll back a database migration destructively. Migration 0011 only replaces policies/functions and is intended to be backward-compatible; if it causes authorization failure, restore the prior policies through a new forward migration.
3. Disable affected expensive/provider routes or revoke provider keys if cost or credential exposure is suspected.
4. Rotate compromised credentials at the provider, update Vercel secrets, redeploy, and invalidate affected sessions/API keys.
5. Preserve logs/audit evidence while excluding document contents and secrets.

## Operations ownership still required

Before public launch, assign a human owner and response target for:

- Vercel/server error alerts
- Clerk auth/webhook failures
- Supabase availability, backups, storage, and RLS incidents
- OpenAI error/cost anomaly alerts
- Stripe webhook/payment failures
- security disclosures and credential rotation
- deletion/retention requests

`harrison@olveraproductions.com` is the current public contact. Formal on-call, SLA, and compliance processes are not yet claimed.
