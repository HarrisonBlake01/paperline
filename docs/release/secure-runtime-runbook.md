# Paperline secure runtime candidate and rollback runbook

Status: prepared; no migration or deployment is authorized by this document.

## Safety rules

- Candidate before production.
- One approved target at a time with recorded project/deployment IDs.
- Migration order is `0011` → `0012` → `0013`; never deploy dependent code first.
- PostgreSQL migrations are forward-fixed; do not destructively rewrite migration history.
- Stripe remains test mode and outbound email/paid/public actions remain disabled unless separately approved.
- Stop on target ambiguity, identity mismatch, migration error, unexpected tenant data, Critical/High finding, secret exposure, or rollback uncertainty.

## Gate A — local release candidate

Record:

```bash
git status --short --branch
git remote -v
git log -5 --oneline --decorate
git diff --stat
git diff --check
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
```

Then scan tracked plus untracked-but-not-ignored candidate files and Git history with Gitleaks. Review every path against the goal baseline and exclude generated/private files.

Pass criteria: every command exits 0, no unresolved Critical/High finding, zero secret findings, dependency residuals documented, and artifact attribution reviewed.

## Gate B — approval packet

Before any external mutation, present:

1. candidate Vercel project/team/branch and immutable URL plan
2. candidate Supabase project ref and proof it is not production
3. remote migration list and SQL review evidence
4. environment-variable names and source/owner only—never values
5. synthetic users/workspaces/files plan
6. Clerk candidate key/origin/redirect plan
7. parser native-runtime smoke fixtures
8. readiness token/monitor scope
9. direct Hermes config/tool allowlist plan
10. NemoClaw/OpenShell sandbox/provider/policy plan
11. rollback owner, triggers, commands, and expected RTO/RPO
12. explicit requested actions

Wait for explicit approval.

## Approved candidate topology recommendation

- Use a separate Vercel project and immutable candidate URL so testing cannot replace the current production alias.
- Reuse the currently linked Supabase project only if the owner confirms it contains no important or production data. This is the simplest path because migrations and synthetic tests can run against the database already configured for Paperline.
- Create a new Supabase project if the current project contains data that must not be exposed to migration, RLS, concurrency, deletion, or failure testing. The purpose is isolation and easy recovery—not a different production architecture.
- Use the current OpenAI-backed application path for candidate tests only if its key is approved for synthetic use and has a monitored spend ceiling. Prefer a separate candidate provider key/project before public launch.

## Gate C — candidate database

After approval only:

1. Re-confirm target project ref and backup/recovery posture.
2. Capture `supabase migration list`.
3. Apply `0011` only; inspect errors and tenant constraints.
4. Test RLS/foreign relationships with synthetic Workspace A/B.
5. Apply `0012`; prove allowed, exhausted `429`, `Retry-After`, fail-closed `503`, and concurrent atomic consumption.
6. Apply `0013`; prove old unscoped keys cannot authenticate, new key digest/scopes/expiry are present, unique digest enforced, and revocation works.
7. Capture final migration list and schema evidence without row/document/secret data.

If migration fails: stop code deployment, preserve exact error, assess forward fix. Do not reset or roll back production data destructively.

## Gate D — candidate deployment

After separate approval only:

1. Deploy once to an immutable candidate URL.
2. Record deployment ID, Git commit/tree identity, build command, runtime region, and environment scope.
3. Verify security/no-store headers and liveness.
4. Call protected `/api/readiness` using the approved monitor secret; require every named check true.
5. Verify invalid readiness secret returns 401 without check detail.
6. Confirm production alias/domain was not changed.

## Gate E — parser and signed-in SaaS

Using synthetic content only:

- PDF text document
- scanned PDF
- DOCX
- TXT
- PNG
- JPEG
- malformed/mismatched/oversized/empty cases

Verify upload, queue/processing/final state, retry conflict, extraction, cited chat, templates, workflow, settings, API-key role gate, and sign-out. Repeat foreign IDs across two workspaces and owner/admin/member roles. Inspect browser console/network, server logs, storage paths, audit events, and provider usage.

## Gate F — direct Hermes

1. Create one scoped 30-day candidate credential through the candidate Paperline UI.
2. Put it in an isolated test `HERMES_HOME` or approved test profile secret file.
3. Configure only the four read-only Paperline tools; disable resources, prompts, sampling, and parallel calls.
4. Run `hermes mcp test paperline`.
5. Discover tools, list synthetic documents, get one summary and citation.
6. Request a foreign document ID and verify stable nondisclosure.
7. Revoke credential and prove the next call fails.
8. Scan test config/logs/evidence for secret material before retention.

## Gate G — NemoClaw/OpenShell-managed Hermes

After separate sandbox/provider/network-policy approval only:

1. Re-verify current NVIDIA docs, `nemoclaw`/`nemohermes` CLIs, stable OpenShell version, blueprint version/digest, and platform support.
2. Create/recreate a non-production Hermes sandbox through supported onboarding.
3. Add the candidate Paperline HTTPS MCP endpoint with one dedicated provider credential name.
4. Unset host shell variable immediately after supported credential ingestion.
5. Inspect sandbox config contains a resolver placeholder, not plaintext.
6. Review generated endpoint path, pinned IPs, request cap, selected adapter binaries, and MCP method groups.
7. Prove allowed discovery and read-only calls.
8. Prove denied host and denied method behavior.
9. Prove the sandbox cannot read the token.
10. Rotate then revoke; prove old credentials fail.
11. Correlate OpenShell activity and Paperline audit by safe IDs only.

Paperline does not currently require NemoClaw/OpenShell for direct MCP. First prove direct Hermes against the candidate. Then install NemoClaw through NVIDIA's current supported quickstart in a separate non-production environment, create one disposable Hermes sandbox, and repeat the same four-tool test through managed MCP. Do not install from an unverified script or pin a stale version without rechecking the official release.

## Monitoring recommendation

Use three small layers rather than one large observability rollout:

1. Vercel deployment/function logs for build and serverless runtime evidence.
2. Sentry for scrubbed application errors. Paperline's SDK configuration disables PII, identity, cookies, HTTP headers/bodies, query parameters, GenAI content, logs, local variables, trace propagation, and replay. Error, transaction, span, and breadcrumb hooks remove raw messages, source context, identifiers, and span data. Tracing is limited to 5% outside development and excludes health/readiness. A real local SDK-envelope test verified synthetic document, prompt, token, authorization, cookie, and query values were absent. The external candidate Sentry project and DSN still require user-held Sentry OAuth/MCP authentication.
3. The current candidate uses the independent Hermes script-only watchdog `3c505d37f12c` every 10 minutes for public `/api/health` plus bearer-protected `/api/readiness`. Healthy checks produce no delivery; failures return a bounded alert to the owner channel. A synthetic delivery completed successfully. Before production, move or duplicate this check into a separately hosted uptime provider so monitoring does not depend on the operator Mac.

Alert owner: Harrison Olvera. Initial triage is Vercel deployment/function evidence, followed by the named readiness checks. If tenant/auth integrity is uncertain, disable candidate traffic and redeploy the last known-good immutable artifact before forward-fixing.

PostHog can be added later for opt-in product analytics after privacy and retention review; it is not the primary incident monitor.

## Retention recommendation

- Keep active-workspace documents and derived text/chunks until the user deletes them; source and derived records share one lifecycle.
- Purge deleted document storage and derived rows within 24 hours after a successful deletion request.
- Give workspace deletion a 30-day recovery window, then purge workspace documents and derived data.
- Keep security/audit metadata for 90 days without document contents or prompts.
- Keep revoked credential metadata for 90 days; never retain plaintext credentials.
- Keep application logs for 30 days and provider/platform backups for the shortest supported recovery window, targeted at 7–30 days.
- Publish these periods only after the deletion jobs, backup behavior, and support process have been implemented and verified.

## Rollback triggers

- cross-workspace content or existence disclosure
- valid revoked/expired credential accepted
- service-role query without workspace predicate
- readiness false after warm-up
- parser/native crash or unacceptable timeout/memory
- unexplained provider spend/retry amplification
- auth redirect/Clerk failure
- CSP blocks authentication/billing/core UI
- secret in client bundle/log/evidence
- migration inconsistency or database integrity error
- OpenShell policy wider than approved host/path/methods
- sandbox can read raw Paperline credential

## Code rollback

1. Remove candidate traffic/alias only; do not alter production alias without approval.
2. Redeploy the last known-good immutable artifact.
3. Verify liveness, protected routes, and signed-out behavior.
4. Keep migrations in place if additive and compatible; ship a forward compatibility fix.
5. Revoke candidate Paperline/MCP/readiness/provider credentials.
6. Preserve redacted logs and open an incident record.

## Migration forward-fix plan

- `0011`: do not drop tenant-integrity constraints/policies to restore broken code; update code or add corrected policy in a new migration.
- `0012`: older code ignores the additive table/function. If the function is faulty, stop dependent code and add a new corrected function migration.
- `0013`: older code ignores additive columns. Existing keys remain unscoped. If credential auth is faulty, disable `/api/mcp`, revoke candidate keys, and forward-fix.

## Final decision

Production remains **NO-GO** until candidate identity, migrations, parser, readiness, two-tenant auth, signed-in E2E, direct Hermes, NemoClaw/OpenShell, monitoring, canonical domain, production Clerk configuration, CSP, secret scans, rollback, and residual-risk review are evidenced and explicitly approved.
