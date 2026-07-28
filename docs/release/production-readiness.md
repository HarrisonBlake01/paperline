# Paperline recruiter release and future-production checklist

## Decision

**Current recruiter decision: LOCAL PREPARATION IN PROGRESS; deployment remains NO-GO until the exact commit passes every candidate gate.**
**Commercial `paperline.io` decision: ON HOLD / NO-GO.**
**Direct Hermes integration: implemented locally; exact recruiter-candidate verification remains required. NemoClaw/OpenShell remains a follow-up.**

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
- `PAPERLINE_MCP_ALLOWED_HOSTS`
- `PAPERLINE_READINESS_TOKEN`
- `PAPERLINE_RECRUITER_DEMO` (must be `true` in the recruiter project)

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
- `PAPERLINE_MCP_ALLOWED_ORIGINS` (normally empty for native clients)

## Active deployment ledger

The current GitHub and production preparation state is maintained in [`checklists/2026-07-27-github-production-prep.md`](./checklists/2026-07-27-github-production-prep.md). The executable deployment test inventory and latest evidence are maintained in [`checklists/2026-07-27-pre-deployment-test-matrix.md`](./checklists/2026-07-27-pre-deployment-test-matrix.md). The older candidate checklist remains historical evidence for the isolated candidate run.

## Pre-deployment blockers

- [x] Make workspace deletion claim/release/finalization verify one operation owner/token so concurrent requests cannot reopen a workspace mid-deletion. Implemented locally in migration `0017`; target application remains approval-gated.
- [x] Make document relational cleanup transactional and preserve chats that remain linked to other documents. Disposable PostgreSQL behavior test passed.
- [x] Add tested recovery semantics for interrupted destructive operations before enabling self-service deletion in production. Stale takeover, destructive resume, non-release, and finalization passed locally and independent review found no remaining Medium+ issue.
- [x] Add stale billing-claim recovery, stable checkout idempotency, persisted pending-session fencing, and lifecycle-aware Stripe webhook handling. Local model/source/SQL tests passed; provider candidate verification remains in the pre-deployment matrix.
- [x] Validate both old and new workspace ownership on tenant-row moves and define/test direct-delete behavior while a workspace is non-writable. Local regression coverage passed.
- [x] Choose recruiter identity: current Vercel project and stable URL `https://paperline-xi.vercel.app`; reserve `paperline.io` for a separate future commercial project.
- [!] Set recruiter stable-target `NEXT_PUBLIC_APP_URL=https://paperline-xi.vercel.app`, `PAPERLINE_RECRUITER_DEMO=true`, and `PAPERLINE_ALLOW_LIVE_STRIPE=false`; provider mutation remains approval-gated.
- [ ] Replace Clerk development keys with production keys and configure allowed origins/redirects.
- [x] Verify `NEXT_PUBLIC_SUPABASE_URL` is the project root, not `/rest/v1`.
- [x] Confirm document bucket is private.
- [x] Review and apply migrations `0011_security_hardening.sql` through `0016_workspace_billing_claim.sql` in order; local/remote parity through `0016` was read back on 2026-07-27.
- [x] Run two-workspace negative RLS/API tests.
- [x] Exercise durable per-workspace limits and verify fail-closed, 429, and `Retry-After` behavior.
- [x] Stage and validate CSP Report-Only policy. Enforced nonce/hash CSP remains a documented post-domain observation decision.
- [!] Configure Stripe test-mode only for the recruiter environment and prove live keys, Prices, Customers, subscriptions, payment methods, and charges are unreachable.
- [ ] FUTURE COMMERCIAL: configure live paid billing only after the commercial track is explicitly resumed; never reuse recruiter resources.
- [!] Configure correct recruiter Clerk and Stripe test-mode webhook URLs/secrets.
- [x] Complete the synthetic signed-in QA matrix.
- [!] Stage the exact current commit without moving `paperline-xi.vercel.app`, then run representative PDF, scanned PDF, DOCX, TXT, PNG, and JPEG processing smoke tests. Older candidate evidence does not satisfy this tree.
- [x] Configure an independent readiness secret and monitor protected `/api/readiness`; `/api/health` remains liveness-only.
- [!] Verify direct Hermes discovery/calls/foreign-ID denial/revocation against the exact current recruiter candidate.
- [ ] In an approved NemoClaw sandbox, verify OpenShell policy, allowed/denied calls, raw credential non-disclosure, rotation, and revocation.
- [x] Re-verify retention/deletion lifecycle concurrency and retry safety after the independent-review blockers above are fixed. Local lifecycle and disposable PostgreSQL tests passed; target backup/restore, monitoring, and alert-delivery evidence remain blocked in the pre-deployment matrix.
- [x] Run final secret/history scan and review every diff — complete clean local gate, `git diff --check`, exact tracked/untracked candidate scan, 22-commit history scan, adversarial review, and narrow corrective re-review all passed on 2026-07-27.

## GitHub and source-control gates

- [x] Exclude the private generated recruiter package from the application repository candidate.
- [x] Add GitHub Actions release gates and Dependabot configuration locally.
- [x] Authenticate GitHub CLI and read back repository visibility, default branch, Vercel Git integration, and branch rules. Repository is private; release-branch Vercel deployment is disabled; private-plan branch protection is unavailable.
- [x] Run the final local/CI-equivalent gates and exact tracked/untracked plus 22-commit Gitleaks scans; all passed on 2026-07-27. GitHub-hosted execution remains pending authentication and push approval.
- [ ] Push a non-production release branch and require its CI checks before any merge to `main`.
- [ ] Treat a Git push to a Vercel-linked production branch as a deployment action requiring explicit production-deployment approval.
- [ ] Verify Vercel uses Node 22.x and the pinned pnpm install/build commands; the current production project inspection reports Node 24.x.

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
pnpm test:mcp
pnpm lint
pnpm build
pnpm audit --prod --audit-level=high
git diff --check
```

The build route table must include the real app APIs/pages, `/api/mcp`, `/api/readiness`, `/contact`, legal/status/changelog pages, and `/ops-agent`.

## Approved-deploy procedure

Only after explicit approval:

1. Capture pre-deploy production URL/deployment ID for rollback.
2. Require clean `git status`, record the reviewed commit SHA/tree and candidate manifest, and verify the exact candidate and history secret scans correspond to that tree.
3. Confirm Vercel environment names and target scopes without printing values.
4. Apply approved database migrations before code only when backward-compatible; otherwise use an expand/migrate/contract sequence.
5. From the clean reviewed commit, run `vercel --prod --skip-domain` only after explicit deployment approval so the stable recruiter alias does not move.
6. Capture the immutable deployment URL and keep the current public alias on its previous deployment during acceptance.
7. Inspect `vercel inspect <deployment-url> --logs` and require Ready.
8. Verify by HTTP and browser:
   - `/`, `/contact`, `/terms`, `/privacy`, `/status`, `/changelog`, `/ops-agent`
   - `/api/health` has safe shape and `no-store`
   - invalid `/api/readiness` credential returns 401; valid candidate monitor credential reports every dependency ready
   - `/api/mcp` rejects missing/invalid credentials and exposes only approved read-only tools to the real Hermes client
   - `/dashboard` and `/documents` redirect signed-out users to `/sign-in`
   - security headers exist and `X-Powered-By` is absent
   - no JavaScript console errors
9. Run the synthetic signed-in smoke journey with isolated recruiter providers and Stripe test mode only; prove no live payment path is reachable.
10. Test rollback/forward-fix semantics, then obtain separate approval before moving `paperline-xi.vercel.app` to the accepted immutable deployment.
11. Record deploy evidence in the release report—never secrets.

## Rollback

1. Use Vercel's previous known-good deployment/instant rollback for code.
2. Do not roll back a database migration destructively. Migrations 0011–0018 are forward-managed; if one causes authorization failure, stop dependent code and restore behavior through a reviewed forward fix or tested isolated restore procedure.
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
