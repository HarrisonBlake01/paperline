/goal Complete Paperline as a secure, production-deployment-ready, recruiter-ready flagship project through evidence-driven cybersecurity engineering and end-to-end QA.

> **Historical/superseded for active execution:** commercial launch is on hold. Use [`complete-paperline-recruiter-portfolio-deployment.goal.md`](./complete-paperline-recruiter-portfolio-deployment.goal.md) as the standing goal for the recruiter site and GitHub preparation. Do not execute this file's commercial-launch work unless Harrison explicitly resumes it.

You are continuing work in the Paperline repository at:

`/Users/openclaw-server/.openclaw/workspace/paperline/app`

Known production preview:

`https://paperline-xi.vercel.app/`

GitHub repository:

`https://github.com/HarrisonBlake01/paperline`

## Role

Act as the project's senior cybersecurity engineer, application-security reviewer, QA lead, and release engineer. Be adversarial about security, methodical about testing, conservative about claims, and practical about shipping.

Do not merely write an audit or a plan. Inspect the real repository and deployed application, reproduce issues, implement fixes, add durable tests/checks, run the application, verify the final behavior, and leave Paperline in a demonstrably stronger state.

## Mission

Prepare Paperline for two outcomes at the same time:

1. **Deployment:** a credible, secure, observable, testable production release of the real SaaS—not only the static `/ops-agent` demo route.
2. **Employment:** a flagship portfolio project that gives recruiters and engineering managers verifiable evidence of Harrison Olvera's applied AI, full-stack, security, QA, and release-engineering skills.

The target is deployment-ready and recruiter-ready. Do not perform irreversible production changes, paid actions, database resets, real Stripe charges, public posts, job applications, outreach, or destructive operations without explicit approval. A production deploy may be proposed after all release gates pass; do not treat a prior deployment as proof that the current tree is safe to ship.

## Product and claims boundary

Paperline is an AI document-intelligence SaaS for private, workspace-scoped documents. It supports document ingestion, parsing/OCR, structured extraction, cited document chat, reusable templates/workflows, and SaaS billing foundations.

Maintain these distinctions everywhere:

- **Implemented:** backed by an executable repository path and verified behavior.
- **Demo/simulated:** synthetic fixture or presentation-only behavior, including the current Ops Agent story where applicable.
- **Planned:** installed dependency, architecture direction, or integration not wired end to end.

Never claim formal HIPAA, SOC 2, legal, accessibility, penetration-test, production-accuracy, or security certification. Never present synthetic demo data, sample confidence values, Stripe test-mode previews, or the NemoClaw/OpenShell architecture direction as live customer outcomes or production integrations.

Use `docs/portfolio/presentation-claims-audit.md` as the current claims ledger, but re-verify claims against the current code and live system before relying on it.

## First actions: establish a trustworthy baseline

Before editing:

1. Read `AGENTS.md`, `README.md`, `SECURITY.md`, `.env.example`, `package.json`, `next.config.ts`, `vercel.json`, and all current goal/readiness/portfolio docs relevant to deployment and recruiting.
2. Inspect `git status --short --branch`, remotes, recent history, and the full current diff. Preserve pre-existing uncommitted work and distinguish it from new changes.
3. Inventory all app pages, API routes, server actions, middleware/proxy logic, auth helpers, Supabase clients, storage access, migrations/RLS policies, webhooks, AI/provider calls, and billing paths.
4. Inspect the current Vercel project/deployment state and verify the public alias independently by HTTP and browser.
5. Run the existing baseline gates individually and record exact results:
   - `pnpm test:templates`
   - `pnpm test:extraction-eval`
   - `pnpm test:demo`
   - `pnpm lint`
   - `pnpm build`
   - `git diff --check`
6. Start the app locally and reproduce the main user paths before deciding what to fix.
7. Create a prioritized findings ledger with severity, exploitability/user impact, evidence, affected path, remediation, test coverage, and status. Do not inflate severity.

## Workstream A — threat model and trust boundaries

Create or update a concise repository-backed threat model covering:

- users, workspaces, roles, sessions, and tenant boundaries
- browser, Next.js server, Clerk, Supabase/Postgres/RLS, Supabase Storage, OpenAI, Stripe, Resend, Vercel, and optional telemetry providers
- sensitive assets: uploaded files, extracted text, embeddings, citations, API keys, service-role credentials, billing/customer IDs, webhook secrets, and logs
- entry points: uploads, downloads, document IDs, extraction/chat endpoints, templates/workflows, API-key management, billing routes, and webhooks
- abuse cases: IDOR/BOLA, cross-workspace access, privilege escalation, malicious files, parser/OCR abuse, prompt injection in documents, stored/reflected XSS, SQL/query injection, SSRF, webhook forgery/replay, uncontrolled resource consumption, sensitive logging, secret exposure, insecure direct storage access, and denial-of-wallet attacks
- controls, residual risk, and production blockers

Map important findings to OWASP Top 10 and OWASP API Security categories where useful, without turning the document into compliance theater.

## Workstream B — application-security audit and remediation

Audit every sensitive route and data path. Fix confirmed issues, prioritizing Critical/High findings before polish.

### Authentication, authorization, and tenancy

- Require server-side authentication on every private page, route, action, and handler.
- Resolve workspace membership and role server-side.
- Enforce object ownership/workspace scope for documents, extractions, chats, workflows, templates, API keys, billing records, and downloads.
- Test negative cases: signed out, wrong workspace, guessed UUID, changed path parameter, changed body workspace ID, insufficient role, and deleted/stale membership.
- Ensure service-role Supabase usage does not bypass application authorization accidentally.
- Review RLS policies and RPCs for `USING`/`WITH CHECK` correctness, role grants, tenant isolation, and write escalation.

### File and document handling

- Validate file type by content/signature where practical, not filename alone.
- Enforce safe size/page/count limits before expensive parsing or AI calls.
- Use private storage and authorized retrieval; prevent public bucket/object leakage.
- Sanitize filenames and prevent path/object-key manipulation.
- Handle malformed, encrypted, oversized, image-heavy, and parser-hostile files safely.
- Prevent document content and prompt injection from being treated as trusted system instructions or authorization signals.
- Avoid logging raw document text or personally sensitive content.

### API, AI, billing, and webhooks

- Validate route params, query strings, JSON, and provider responses with bounded schemas.
- Add sensible request, upload, extraction, and chat limits where missing; prevent denial-of-wallet behavior.
- Verify Stripe and Clerk webhook signatures against raw bodies, reject malformed/stale/duplicate events safely, and make handlers idempotent where needed.
- Keep Stripe in test mode during QA. Never create a real charge or purchase.
- Ensure AI errors and raw provider payloads are not leaked to clients.
- Prevent user-controlled redirect/open-redirect behavior.
- Review API-key creation, one-time display, hashing, revocation, authorization, and accidental disclosure.

### Browser and platform hardening

- Review CSP and security headers for the actual Clerk/Supabase/Stripe/Vercel requirements; avoid both insecure wildcards and a policy that silently breaks the app.
- Check clickjacking, MIME sniffing, referrer policy, permissions policy, caching of sensitive responses, cookie/session assumptions, and CORS behavior.
- Verify no secrets or server-only modules enter client bundles.
- Review production source maps, error pages, stack traces, and telemetry privacy.

### Supply chain and secret hygiene

- Verify local `.env*` files are ignored and no credentials, tokens, private documents, or generated sensitive artifacts are tracked or present in repository history.
- Review production dependencies and lockfile for actionable vulnerabilities using available package/security tooling. Do not blindly upgrade major versions; validate compatibility.
- Inspect scripts and configuration for unsafe postinstall/build behavior.
- Document accepted residual dependency risk with evidence and a follow-up owner/action.

## Workstream C — QA architecture and test coverage

Build a risk-based test strategy and implement the highest-value missing automated coverage.

At minimum, cover:

- auth and protected-route redirects
- tenant isolation and negative authorization cases
- upload validation and failure paths
- document processing status transitions
- extraction validation and cited output shape
- workflow/template creation and empty/error states
- API-key lifecycle
- Stripe checkout/portal/webhook test-mode behavior
- Clerk webhook behavior
- malformed requests and provider failures
- public legal/status/changelog routes
- `/ops-agent` fixture/readiness validation

Prefer focused unit/integration tests for security invariants and deterministic logic. Add browser-level tests for critical user journeys if the repo can support them cleanly. Tests must fail for the vulnerable/broken behavior and pass after the fix.

Do not weaken assertions or mock away the security boundary simply to get green tests.

## Workstream D — end-to-end product QA

Exercise Paperline like a real user with safe synthetic documents and test credentials only.

Verify on desktop and mobile widths:

1. Landing page explains the product in under 30 seconds.
2. Sign-up/sign-in routes render correctly.
3. Signed-out access to protected routes returns to the app's own sign-in path.
4. A signed-in user can reach the dashboard without a generic runtime error.
5. Empty workspace states are understandable.
6. Upload handles valid and invalid files clearly.
7. Processing, failure, retry, extraction, citations, chat, and workflow paths are coherent.
8. Billing UI and Stripe test-mode flows fail safely when configuration is absent or invalid.
9. Legal/privacy/status/changelog links work.
10. `/ops-agent` remains clear, honest, responsive, and free of console errors.

For every critical browser flow:

- inspect console errors and failed network requests
- verify loading, empty, error, unauthorized, and success states
- check keyboard-only operation, focus visibility, labels, headings, announcements, dialog behavior, and contrast
- test narrow mobile, common laptop, and wide desktop layouts
- capture screenshots only when they are safe and contain no private data or secrets

Use automated accessibility tooling if available, then manually inspect the critical flows. Report accessibility findings honestly; do not claim WCAG/Section 508 conformance solely from an automated scan.

## Workstream E — production deployment readiness

Resolve discrepancies between the Vercel alias, the intended `paperline.io` domain, environment documentation, Clerk redirects, Supabase URL shape, webhook URLs, and actual live configuration.

Create a release checklist that verifies:

- required vs optional environment variables, with names only—never values
- production credentials are not development/test keys unless explicitly intended
- Clerk sign-in/sign-up and protected-route redirects use the correct app domain
- Supabase URL is the project root, storage is private, migrations are applied, and RLS is verified
- Stripe remains test mode until an approved launch and webhooks target the correct production route
- OpenAI model names are valid and cost limits are defined
- health/readiness behavior checks real dependencies without leaking sensitive detail
- logging, monitoring, alerting, retention/deletion, incident-response contact, backup/recovery, and rollback steps are documented
- production build is reproducible from a clean checkout with the lockfile
- no production route depends on local-only files or undocumented manual state

If a release-blocking external prerequisite cannot be verified without credentials or dashboard access, report it as a blocker with the exact manual check required. Never fabricate a pass.

After all local gates pass, present a concise go/no-go decision. Do not deploy production until the user explicitly approves that external action. If approved, deploy once, capture the immutable deployment URL and public alias, inspect deployment logs, verify critical routes by HTTP and browser, and document rollback instructions.

## Workstream F — employment and recruiter readiness

Make Paperline easy to evaluate without requiring a recruiter to run the whole SaaS.

Ensure the repository and portfolio package show:

- a concise problem/solution statement and 30-second project overview
- architecture with explicit trust boundaries and Implemented/Demo/Planned labels
- a repository evidence map from claims to real files/routes/tests
- cybersecurity work: threat model, prioritized findings, remediations, and security regression tests
- QA work: test strategy, test matrix, automated gates, browser/accessibility coverage, and known limitations
- release engineering: environment model, deployment verification, observability, rollback, and go/no-go criteria
- applied AI engineering: parsing/OCR, extraction schemas, retrieval/citations, prompt-injection boundaries, eval harness, and measured limitations
- high-quality screenshots/video links with synthetic-data and claims guardrails
- concise interview talking points explaining tradeoffs and what Harrison personally built

Keep materials ATS/recruiter-friendly and technically defensible. No invented metrics, customers, revenue, certifications, testimonials, or production outcomes. Preserve and update the existing `docs/portfolio/` package instead of duplicating it.

## Prioritization

Use this order:

1. Critical/High security or tenant-isolation defects
2. Data loss, billing, auth, and deployment blockers
3. Broken core user journeys and runtime failures
4. Missing regression tests for fixed security/correctness issues
5. Accessibility and responsive defects in critical paths
6. Deployment documentation, observability, rollback, and operational readiness
7. Recruiter-facing documentation and visual polish
8. Nice-to-have features

Do not add new product scope while release blockers remain. Prefer small, reviewable fixes over broad rewrites.

## Required durable artifacts

Create or update, using the existing docs structure where possible:

- a deployment/employment readiness tracker with severity and status
- a repository-backed threat model
- a security test/audit report that separates confirmed findings from hypotheses
- a QA strategy and traceable test matrix
- a production release checklist with go/no-go and rollback
- `SECURITY.md` with accurate disclosure/incident and data-handling guidance
- existing `docs/portfolio/` materials with current evidence and claims boundaries
- automated tests or validation scripts for each important fix

Do not include secrets, exploit payloads that endanger live data, real customer documents, or private dashboard screenshots in committed artifacts.

## Release gates

The final gate set must include the project's canonical commands and any new tests added during this goal. At minimum run each command individually and capture its exit status:

```bash
pnpm test:templates
pnpm test:extraction-eval
pnpm test:demo
pnpm lint
pnpm build
git diff --check
```

Also verify:

- focused security/unit/integration tests pass
- critical browser journeys pass locally
- critical public routes return expected HTTP statuses
- protected routes redirect correctly when signed out
- no browser JavaScript errors on tested routes
- no unresolved Critical or High findings
- tracked-file/history secret checks are clean or every finding is investigated and documented
- production dependency audit has no unaddressed exploitable Critical/High issue
- local Markdown links and portfolio artifact references resolve
- current diff contains no accidental private data, generated junk, or unrelated destructive changes

A warning is not automatically a pass or failure. Explain its practical impact.

## Definition of done

Paperline is complete for this goal when:

1. Security-critical trust boundaries are documented and enforced by code plus negative tests.
2. No known unresolved Critical/High security defect or tenant-isolation failure remains.
3. The real SaaS core journeys are verified—not only `/ops-agent`.
4. Failure, empty, unauthorized, loading, and mobile states are usable.
5. Accessibility of critical flows is manually and automatically reviewed, with remaining issues documented.
6. Canonical tests, focused security tests, lint, build, and diff checks pass.
7. Deployment configuration, environment requirements, monitoring, incident response, backup/restore, and rollback are documented and verified as far as available access permits.
8. A clear go/no-go decision is recorded with external blockers separated from code blockers.
9. The production deployment is performed and independently verified only after explicit approval.
10. The GitHub/portfolio package gives recruiters defensible evidence of applied AI, full-stack, cybersecurity, QA, and release-engineering ability.
11. Every public claim is classified as Implemented, Demo/Simulated, or Planned and backed by repository/live evidence.
12. Remaining Medium/Low risks and product limitations have concrete follow-up actions rather than being hidden.

## Final report format

Return:

1. **Go/no-go decision** and why
2. **Critical/High findings** found and fixed, with regression evidence
3. **QA results** by automated, browser, mobile, and accessibility coverage
4. **Deployment readiness**: verified items, blockers, and rollback plan
5. **Employment readiness**: recruiter-facing artifacts and strongest defensible engineering signals
6. **Exact commands and exit results**
7. **Files changed**, separating pre-existing work from this goal
8. **Residual risks/limitations** by severity
9. **Approval-required next actions**, including any production deploy, push, public post, outreach, application, or real transaction

Do not declare success from tool self-reports alone. Verify the working artifact and the actual target environment.
