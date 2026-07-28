/goal Establish and verify Paperline's secure runtime path as a production-grade, recruiter-ready demonstration of senior application development, application security, QA, and release engineering.

> **Historical/superseded for active execution:** commercial launch is on hold. Use [`complete-paperline-recruiter-portfolio-deployment.goal.md`](./complete-paperline-recruiter-portfolio-deployment.goal.md) as the standing goal for `paperline-xi.vercel.app` and GitHub recruiter preparation. Preserve the engineering evidence here, but do not execute its commercial-launch or broader integration scope unless Harrison explicitly resumes it.

You are continuing work in the Paperline repository at:

`/Users/openclaw-server/.openclaw/workspace/paperline/app`

Known public preview:

`https://paperline-xi.vercel.app/`

GitHub repository:

`https://github.com/HarrisonBlake01/paperline`

## Role

Act as Paperline's veteran senior application developer, application-security engineer, QA lead, site-reliability-minded release engineer, and technical portfolio reviewer.

Work from real repository, database, deployment, browser, and runtime evidence. Do not stop at architecture prose, an audit, or a successful local build. Trace the core request path, implement missing controls, exercise it in an approved non-production runtime, preserve evidence, and make a conservative go/no-go decision.

Use senior-level judgment:

- fix root causes rather than masking symptoms
- prefer small, reviewable changes over rewrites
- distinguish liveness, readiness, correctness, security, and availability
- treat tenant authorization, migrations, parsers, provider calls, and deployment order as runtime boundaries
- add durable regression checks for every important fix
- never fabricate a pass when credentials or environment access are unavailable

## Goal and model operating mode

Treat this file as the standing Paperline goal and keep working from its
remaining evidence gaps until the definition of done is satisfied or an
approval gate/blocker is reached. Keep the dated release checklist synchronized
with verified runtime evidence; do not replace this goal with temporary chat
state or an unaudited plan.

Use the named Hermes MoA preset `paperline` selectively for hard review gates:

- references: `xai-oauth:grok-4.5` and `nous:google/gemini-3.1-pro-preview`
- acting aggregator: `openai-codex:gpt-5.6-sol`
- use cases: architecture decisions, adversarial security review, tenant-boundary
  analysis, release go/no-go, evidence reconciliation, and recruiter-claim review
- normal implementation, browser operation, and mechanical verification should
  remain single-model unless multiple perspectives materially reduce risk

The references are advisory and receive conversation text without Hermes tool
schemas; only the GPT aggregator acts, calls tools, edits files, and makes the
final recommendation. Treat every model opinion as a hypothesis until confirmed
against repository, database, browser, deployment, or provider evidence. Record
material disagreement and the evidence used to resolve it.

Do not send credentials, document contents, personal data, or unrelated tenant
data through MoA prompts. Use synthetic fixtures and bounded metadata. Keep MoA
trace persistence disabled unless a separate redacted-evidence plan is approved.
Because each MoA iteration makes three model calls, use it at phase boundaries
rather than for every tool turn.

## Mission

Build a secure, observable, reproducible runtime path for the real authenticated SaaS:

`browser → Clerk session → Next.js/Vercel route → workspace authorization → Supabase/RLS/private storage → bounded parser/OCR → AI provider → validated result → persisted tenant-scoped state → safe UI response`

Also build one policy-governed agent integration surface shared by two supported consumption modes:

1. **Direct Hermes users:** Hermes connects to Paperline as an authenticated remote Streamable HTTP MCP server and receives a least-privilege Paperline tool set.
2. **NemoClaw/OpenShell-managed Hermes:** the same Paperline MCP endpoint is reached from a NemoClaw-managed Hermes sandbox through OpenShell-controlled credentials, network policy, and MCP/JSON-RPC method rules.

Do not build separate privileged backdoors for each agent. Browser, direct-Hermes, and sandboxed-Hermes requests must converge on the same tenant authorization, validation, rate-limit, approval, audit, and stable-error boundaries.

The result must support two outcomes:

1. **Engineering release readiness:** Paperline's core signed-in document journey can run safely in an approved candidate environment with verified migrations, authorization, native parser packaging, cost controls, monitoring, and rollback.
2. **Recruiter readiness:** the repository contains concise, verifiable evidence of senior full-stack, security, QA, cloud-runtime, and release-engineering decisions—not unsupported claims or screenshots without traceability.

This goal is narrower than general product completion. Do not add unrelated features while runtime blockers remain.

## Current known state

Re-verify rather than blindly trusting this handoff:

- unrestricted production launch is currently **NO-GO**
- Next.js targets `16.2.10`; Node targets `22.x`; pnpm targets `10.33.4`
- local code includes security migrations `0011_security_hardening.sql` and `0012_workspace_rate_limits.sql`
- those migrations have not been proven applied to the target runtime
- routes using the rate-limit RPC must not deploy before migration `0012`
- the existing public deployment previously crashed in document processing because PDF.js canvas/DOMMatrix support was missing
- local code now lazy-loads PDF dependencies, externalizes native packages, replaces macOS-only scanned-PDF rendering, and has `pnpm test:parser-runtime`
- local parser verification is not Vercel verification
- `/api/health` is intentionally liveness-only and must not be presented as dependency readiness
- production Clerk configuration previously used development keys
- no two-user/two-workspace authenticated isolation matrix has been completed
- Paperline currently describes NemoClaw/OpenShell as Planned; no completed Paperline MCP server or verified Hermes client integration exists yet
- current NVIDIA documentation includes a dedicated **NemoClaw for Hermes** path: NemoClaw writes Hermes configuration under `/sandbox/.hermes`, while OpenShell owns sandbox lifecycle, policy, inference routing, credential handling, and integration egress
- current NVIDIA managed-MCP architecture uses authenticated **Streamable HTTP MCP**, OpenShell provider-held credentials outside the sandbox, `protocol: mcp` network policy, and explicit JSON-RPC method rules; re-verify the pinned stable OpenShell/NemoClaw versions before implementation
- the exact working tree contains substantial pre-existing work and must be reviewed before commit/deploy

Read and update these sources of truth:

- `docs/readiness-tracker.md`
- `docs/security/security-audit.md`
- `docs/security/threat-model.md`
- `docs/qa/test-strategy.md`
- `docs/release/production-readiness.md`
- `docs/portfolio/presentation-claims-audit.md`
- `SECURITY.md`

Re-check these upstream integration references before implementation because commands, versions, and policy schemas can change:

- NVIDIA NemoClaw for Hermes architecture: `https://docs.nvidia.com/nemoclaw/user-guide/hermes/about/how-it-works`
- NVIDIA managed MCP architecture for Hermes: `https://docs.nvidia.com/nemoclaw/user-guide/hermes/manage-sandboxes/mcp-servers/about-managed-mcp-servers`
- NVIDIA NemoClaw for Hermes home/quickstart: `https://docs.nvidia.com/nemoclaw/user-guide/hermes/home`
- Hermes Agent MCP documentation: `https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp`
- Hermes Agent source/reference: `https://github.com/NousResearch/hermes-agent`

If repository assumptions conflict with current official documentation, use current official documentation and record the change in the runtime findings ledger.

## Claims and safety boundary

Classify every capability and artifact as:

- **Implemented:** executable path plus verified behavior
- **Demo/Simulated:** fixture-driven or presentation-only behavior
- **Planned:** direction or dependency not connected end to end

Never claim HIPAA, SOC 2, WCAG/Section 508 conformance, penetration-test certification, formal security certification, production AI accuracy, production uptime, customer outcomes, or live third-party integrations without evidence that supports the exact statement.

Do not describe Paperline as integrated with NemoClaw, OpenShell, Hermes MCP, or a Nous-reviewed MCP catalog until the corresponding endpoint, client configuration, policy, and end-to-end tests actually exist. During implementation, label the work **Planned** or **In progress**; graduate it to **Implemented** only after direct Hermes and approved sandbox-runtime evidence passes.

Do not print, persist, commit, or include secrets in evidence. Environment-variable names are allowed; values are not.

Do not perform any of the following without explicit user approval at the point of action:

- production or preview deployment
- remote migration application
- Git commit or push
- DNS/domain changes
- Clerk, Supabase, Stripe, Vercel, OpenAI, Resend, or monitoring dashboard changes
- creation of real charges or paid resources
- database reset, destructive migration, or history rewrite
- public post, recruiter outreach, or job application

Read-only inspection is allowed. Local code/test/document changes are allowed. If an approved candidate runtime is unavailable, finish all local preparation, provide exact dashboard/manual steps, and report the runtime verification as blocked.

## Phase 1 — establish a trustworthy runtime baseline

Before editing:

1. Read `AGENTS.md`, `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `vercel.json`, `.env.example`, the parser/pipeline code, auth/workspace helpers, Supabase clients, migrations, health/status paths, and release/readiness documents.
2. Run `git status --short --branch`, inspect remotes/recent history, and review the complete diff. Preserve pre-existing work and record a new baseline before adding runtime-path changes.
3. Inventory the exact core runtime path:
   - protected pages and proxy rules
   - upload, process, extraction, chat, and workflow routes
   - service-role queries and server-side workspace/role gates
   - RLS policies, RPCs, grants, and private-storage access
   - native parser dependencies and file tracing
   - OpenAI calls, quotas, rate limits, atomic claims, and usage accounting
   - logs, status transitions, user-visible errors, liveness/readiness, and telemetry
4. Inspect the current Vercel deployment identity, runtime version, environment scopes, function logs, and alias without exposing values.
5. Inspect local/remote Supabase migration parity without applying changes.
6. Reproduce the known deployed parser failure if it is still safely reproducible; preserve bounded evidence without document contents or secrets.
7. Run every existing local gate independently and record command, timestamp, exit status, and meaningful output.
8. Create or update a runtime-path findings ledger with severity, exploit/user impact, evidence, remediation, test, owner, status, and external dependency.

## Phase 2 — define the environment and deployment contract

Create a clear environment matrix for local, candidate/staging, and production. Record variable names and configuration purpose only.

At minimum cover:

- canonical app URL
- Clerk publishable/secret keys, allowed origins, redirects, and webhook secret
- Supabase project URL, anon key, service-role key, migration target, and private document bucket
- OpenAI key/model/cost controls
- Stripe mode, prices, webhook secret, and explicit live-key opt-in
- email provider configuration
- error monitoring, structured logs, uptime/readiness monitoring, and release identifiers

Requirements:

- candidate and production must use distinct intended scopes where the provider supports them
- production must not rely on Clerk development keys
- Stripe must remain test mode unless a separate real-launch approval is granted
- `NEXT_PUBLIC_APP_URL`, Clerk redirects, webhook endpoints, email links, and canonical docs must agree
- configuration validation must fail safely without enumerating secret names publicly
- the build and runtime must not depend on ignored local files, macOS-only binaries, or undocumented manual state
- document code/migration ordering explicitly: apply compatible schema/RPC controls before code that requires them

Do not create paid or external resources without approval. Produce exact setup steps when blocked.

## Phase 3 — prove database, tenancy, and storage controls

Use a safe local or explicitly approved non-production Supabase target.

1. Parse and review migrations `0011` and `0012` again.
2. Apply migrations in order only after explicit approval and only to the approved target.
3. Preserve before/after migration parity evidence.
4. Verify function ownership, fixed `search_path`, grants, RLS enablement, `USING`, `WITH CHECK`, and tenant-consistent foreign-key relationships.
5. Confirm the document bucket is private and object keys cannot escape workspace/document scope.
6. Create two synthetic users and two synthetic workspaces only with approval.
7. Execute positive and negative tests for:
   - documents and storage objects
   - folders/tags
   - extractions
   - chats/messages/citations
   - templates/community actions
   - workflows/runs
   - API-key metadata and lifecycle
   - audit logs/member administration
   - billing/customer references
8. Test signed out, member, admin, owner, stale membership, guessed UUID, body/path workspace substitution, and cross-workspace relationship attempts.
9. Prove service-role application queries authorize before fetching or mutating privileged records; do not treat RLS or disabled UI controls as protection for service-role calls.
10. Verify migration rollback strategy is forward-fix and non-destructive.

A tenant-isolation test passes only when the authorized request succeeds and the corresponding foreign-tenant request returns a bounded denial/not-found response without leaking existence or metadata.

## Phase 4 — verify the native document runtime in the target shape

Treat parser compatibility as a release gate, not a build detail.

1. Keep PDF/native dependencies lazy-loaded so unrelated route initialization cannot crash.
2. Verify Next.js server externalization/file tracing includes `pdf-parse`, `@napi-rs/canvas`, worker assets, and platform-native packages.
3. Ensure no parser path invokes Swift/AppKit, shell tools, or local-only absolute paths in Linux serverless runtime.
4. Destroy parser/rendering resources deterministically.
5. Add or strengthen deterministic tests for:
   - text PDF parsing
   - scanned-PDF page rendering
   - DOCX
   - TXT
   - PNG/JPEG OCR preparation
   - malformed/truncated/encrypted PDFs
   - zero-byte and signature-mismatched files
   - oversized dimensions/page counts and bounded failures
6. Use synthetic fixtures only. Do not commit private documents.
7. In an approved candidate deployment, upload/process representative PDF, scanned PDF, DOCX, TXT, PNG, and JPEG files.
8. Inspect function logs, duration, memory, state transitions, storage cleanup, retry behavior, and client-facing errors.
9. Confirm a malformed or unsupported file fails with a stable public code and no raw parser/provider detail.
10. Record immutable deployment identity with the test evidence.

A local `pnpm build` or successful module import is insufficient. Candidate-runtime parse and render evidence is required before production GO.

## Phase 5 — enforce bounded, idempotent expensive work

Verify upload, processing, OCR, embeddings, extraction, chat, template generation, and workflow execution as hostile-input and denial-of-wallet boundaries.

- exercise migration `0012` in the approved test target
- verify successful requests, exhausted-window `429`, `Retry-After`, and limiter-unavailable `503`
- ensure limits are per workspace and operation, atomic across instances, and service-role-only
- verify concurrent process/retry requests produce one atomic claim, one provider execution, one usage record, and one final state
- verify storage cleanup after post-upload database failure
- test provider timeout, rate limit, malformed response, invalid JSON, and retry exhaustion
- prevent raw document text, prompts, provider payloads, stack traces, SQL details, or secrets from entering logs or user-visible state
- use stable public failure codes and safe recovery guidance
- document remaining need for atomic page/token reservation or a durable queue rather than pretending fixed-window rate limits solve concurrency

Use mocks for deterministic concurrency/provider failure tests, then perform bounded candidate-runtime smoke tests with approved test credentials.

## Phase 6 — authentication and authorization runtime QA

With approved synthetic accounts:

1. Verify sign-up/sign-in/sign-out and protected-route redirects on the candidate domain.
2. Verify Clerk user provisioning and webhook signature failure behavior.
3. Verify personal workspace creation is idempotent.
4. Verify role changes and removed memberships take effect without stale access.
5. Confirm member users cannot fetch admin audit/API-key metadata; test the boundary, not only the hidden UI.
6. Confirm auth errors do not expose internal IDs, keys, or provider details.
7. Verify production-target configuration has no Clerk development-mode warning.
8. Test OAuth redirect origins if OAuth is enabled.
9. Record browser console/network evidence without session tokens or personal data.

Do not use a real personal workspace as a substitute for controlled tenant-isolation testing.

## Phase 7 — liveness, readiness, observability, and incident response

Maintain a strict distinction:

- **liveness:** the process can answer
- **readiness:** dependencies required for the core journey are available
- **functional smoke:** a representative user operation succeeds
- **monitoring:** failures are detected and routed to a human owner

Requirements:

1. Keep `/api/health` explicitly liveness-only and `Cache-Control: no-store`.
2. Design a protected or non-sensitive dependency-readiness mechanism that checks only what can be checked safely and cannot become a public denial-of-wallet vector.
3. Do not expose secret names, connection strings, bucket names, provider payloads, database details, or stack traces.
4. Include a release/deployment identifier suitable for correlating evidence without leaking secrets.
5. Add structured, bounded logs for request/operation ID, route, workspace-safe identifier strategy, status transition, duration, provider category, and stable error code.
6. Confirm document text and prompts are excluded or irreversibly redacted.
7. Define alerts for elevated 5xx, parser failures, auth/webhook failures, rate-limit anomalies, AI cost anomalies, storage failures, and failed jobs.
8. Assign owner, severity, response target, and runbook link for each alert class.
9. Test one safe synthetic failure and prove it is observable end to end in the approved candidate environment.
10. Document credential rotation, provider disablement, Vercel rollback, migration forward-fix, evidence preservation, and user-impact communication.

If monitoring is not connected, label it Planned/Blocked; do not render a green status page.

## Phase 8 — browser, mobile, accessibility, and failure-state QA

Exercise the real candidate runtime—not only `/ops-agent`—at mobile, laptop, and wide-desktop widths.

Verify:

- landing → sign-in → dashboard
- empty workspace
- upload → process → extraction/review
- citation-backed chat with answer/source numbering agreement
- template generation and workflow execution
- member/admin settings and integrations views
- API-key creation/revocation foundation without claiming a public API
- Stripe test-mode checkout/portal only when configured
- sign-out and subsequent protected-route denial

For each journey inspect:

- browser console and failed network requests
- loading, empty, success, timeout, partial-failure, retry, unauthorized, forbidden/not-found, and rate-limited states
- keyboard operation, focus order/visibility, accessible names, landmarks, dialogs, announcements, contrast, zoom, and responsive overflow
- accidental disclosure in URL, response body, rendered UI, logs, screenshots, and analytics

Use automated accessibility tooling plus manual inspection. Do not claim certification from a Lighthouse/axe score.

## Phase 9 — CSP and browser/runtime hardening

- enumerate actual candidate origins used by Clerk, Supabase, Stripe, monitoring, fonts/assets, and app networking
- stage a report-only CSP first
- collect and classify violations during signed-in journeys
- remove unnecessary origins/directives
- adopt nonce/hash handling if required by the current Next.js/Clerk architecture
- enforce CSP only after critical journeys pass without unsafe broad exceptions
- re-verify frame denial, MIME sniffing protection, referrer policy, permissions policy, API no-store, sensitive-page caching, CORS, and absence of `X-Powered-By`
- prove no server secret or server-only module enters client bundles

A CSP that breaks auth or billing is a failed control. A CSP built from broad `*`/unnecessary `unsafe-*` allowances is not complete.

## Phase 10 — Paperline agent access: direct Hermes and NemoClaw/OpenShell

Design Paperline as an authenticated remote Streamable HTTP MCP service that exposes bounded document-intelligence capabilities to agent clients. The direct Hermes path and NemoClaw/OpenShell path must use the same public protocol and application authorization layer.

### Required architecture

**Direct Hermes mode**

`Hermes → HTTPS Streamable HTTP MCP → Paperline MCP transport → authenticated principal/workspace binding → shared Paperline application services → Supabase/private storage/providers`

Hermes should be able to discover and use Paperline through its native MCP client. Verify the current Hermes commands/configuration against official Nous Research documentation before publishing setup instructions. Expected integration shape is a remote HTTP MCP entry with an authorization mechanism and an explicit tool allowlist; do not hardcode secrets into `config.yaml`, screenshots, commands, or docs.

**NemoClaw/OpenShell-managed Hermes mode**

`Hermes in /sandbox/.hermes → OpenShell gateway egress → protocol:mcp policy + JSON-RPC method controls + provider credential replacement → Paperline Streamable HTTP MCP endpoint`

Follow the current official **NemoClaw for Hermes** documentation, not the older OpenClaw-only assumptions in Paperline's hackathon copy. Re-verify current stable versions and supported commands before use. Preserve these documented boundaries unless current upstream docs supersede them:

- NemoClaw is host-side lifecycle/onboarding and a versioned blueprint, not the Paperline data plane
- Hermes runs inside the OpenShell sandbox with configuration under `/sandbox/.hermes`
- OpenShell owns sandbox lifecycle, controlled network egress, policy enforcement, inference routing, and provider-backed credential replacement
- external Paperline credentials remain outside the sandbox
- Paperline is reached through a native Streamable HTTP MCP endpoint
- no Paperline-specific host proxy, stdio bridge, credential relay, listener, or long-running NemoClaw data-plane process should be invented
- the OpenShell network policy must allow only the Paperline MCP origin and required MCP/JSON-RPC methods

Treat official NVIDIA and Hermes documentation as sources of truth. Record the exact URLs and verification date in integration docs, but do not claim NVIDIA or Nous endorsement.

### Authentication, identity, and tenant binding

Choose and document a standards-compatible remote MCP authentication model supported by the current Hermes client. Prefer OAuth where the available Hermes/MCP stack and Paperline account model support it; otherwise implement a narrowly scoped bearer-token path as an explicit first release and document the upgrade path.

Requirements:

- authenticate every MCP request before tool dispatch
- resolve the Paperline user and workspace server-side from the authenticated credential and current membership
- never trust a model-supplied `workspace_id`, document ID, or role as authorization
- bind credentials to one user, one workspace, allowed scopes, status, creation time, expiration, and revocation state
- generate high-entropy credentials, display them once, store only a strong hash plus non-secret prefix/metadata, compare safely, and support rotation/revocation
- keep Paperline/API/MCP credentials out of the sandbox in NemoClaw mode; use OpenShell's supported provider credential mechanism
- ensure removed users, downgraded roles, expired credentials, and deleted workspaces lose access promptly
- prevent browser session/CSRF assumptions from being reused incorrectly for bearer-authenticated MCP calls
- define CORS separately from MCP authorization; CORS is not an agent security boundary
- return bounded MCP/JSON-RPC authentication and authorization errors without account, workspace, token, SQL, or provider detail

Review the existing API-key foundation before extending it. Do not expose currently generated keys to an API until authentication, scope, expiry, audit, rate-limit, and negative tenant tests exist.

### Initial MCP capability surface

Start least-privilege and read-oriented. Define exact input/output schemas, limits, scopes, costs, and approval class for every tool. Candidate capabilities include:

- `paperline_list_documents` — bounded metadata only; no raw storage URLs
- `paperline_search_documents` — tenant-scoped semantic/text retrieval with pagination and result limits
- `paperline_get_document_summary` — safe processed status/summary, never raw provider errors
- `paperline_get_citations` — page/snippet evidence limited to authorized documents
- `paperline_list_templates`
- `paperline_run_extraction` — expensive mutation with rate limit, idempotency, atomic claim, and usage accounting
- `paperline_get_extraction`
- `paperline_list_workflows`
- `paperline_prepare_workflow_run` — creates a reviewable plan without performing external action
- `paperline_get_operation_status`

Do not expose arbitrary SQL, storage paths, raw document downloads, unrestricted prompt execution, arbitrary URLs, shell commands, billing mutation, email sending, or external spend through the first MCP surface.

Separate capabilities into:

- **read-only** — may run after auth and authorization
- **expensive internal mutation** — requires explicit scope, idempotency, quotas, atomic claim, and auditable usage
- **external or financial action** — disabled initially or requires a durable human approval object that the agent cannot self-approve

Tool descriptions must treat document text, filenames, metadata, retrieved chunks, and model output as untrusted data. Tool output must never instruct Hermes to ignore its policy, reveal credentials, or perform unapproved actions.

### MCP transport and protocol hardening

- use the current MCP SDK/protocol rather than a custom JSON tool API presented as MCP
- support the Streamable HTTP transport expected by Hermes and NemoClaw managed MCP
- implement initialization, capability negotiation, tool discovery, tool invocation, cancellation/timeouts, and stable protocol errors correctly
- validate JSON-RPC version, request IDs, methods, content type, body size, nesting depth, schema, string lengths, arrays, pagination, and batch behavior
- decide explicitly whether batch requests and server-initiated sampling are unsupported; reject them safely rather than inheriting dangerous defaults
- do not allow MCP sampling/tool loops to trigger unbounded Paperline or provider work
- apply request-level and tool-level rate limits before expensive calls
- issue correlation/operation IDs without leaking tenant identifiers
- set no-store and appropriate security headers on authenticated MCP responses
- ensure logs contain tool name, safe principal/workspace pseudonym, scope, result code, duration, cost category, approval ID, and operation ID—but no token, document text, prompts, citations beyond safe IDs, or provider payloads
- preserve backward-compatible tool schemas or version the integration deliberately

### Human approval and external-action boundary

Model every consequential action as `proposed → awaiting_human_approval → approved|rejected|expired → executing → succeeded|failed`.

- agents may propose actions but may not create their own approval
- approval must bind actor, workspace, exact action, normalized parameters, cost/spend ceiling, expiry, and idempotency key
- parameter changes invalidate prior approval
- execution checks approval atomically immediately before the side effect
- replayed or concurrent calls produce one execution and one audit record
- Stripe remains test mode during QA
- first release should prefer draft/preparation tools over real outbound actions

### Direct Hermes user experience

Provide a recruiter-quality but real onboarding path for a Paperline workspace administrator:

1. Create a scoped Paperline agent credential or complete supported OAuth authorization.
2. Copy a secret-free endpoint/config example.
3. Add Paperline through the current `hermes mcp add` or documented `mcp_servers` workflow.
4. Configure only the intended Paperline tools through Hermes's MCP tool selection.
5. Run `hermes mcp test paperline` and inspect discovery/auth health.
6. Reload/restart Hermes as required by the current client.
7. Ask Hermes to list authorized documents and retrieve a citation from a synthetic fixture.
8. Revoke the credential in Paperline and prove the next call fails safely.

Create an optional Paperline Hermes skill only if it adds workflow guidance beyond MCP tool descriptions. A skill must never contain credentials or substitute for protocol authorization. Treat submission to the Nous-reviewed MCP catalog as a separate Planned/publication action requiring source review and explicit approval.

### NemoClaw/OpenShell verification

In an explicitly approved non-production sandbox:

1. Verify current NVIDIA prerequisites, pinned stable OpenShell version, `nemohermes` workflow, blueprint digest, and platform support.
2. Create/recreate a Hermes sandbox through the supported NemoClaw entry point.
3. Configure Paperline as a managed Streamable HTTP MCP server through supported NemoClaw/OpenShell commands.
4. Store the Paperline credential in the OpenShell provider/credential boundary, not `/sandbox/.hermes`, shell history, or workspace files.
5. Generate/review policy allowing only the Paperline MCP hostname, transport, and required JSON-RPC methods.
6. Prove allowed Paperline tool discovery and invocation succeeds.
7. Prove requests to an unapproved host/method are denied and logged.
8. Prove the sandbox cannot read the raw Paperline credential.
9. Rotate/revoke the credential and verify subsequent calls fail safely.
10. Inspect OpenShell/NemoClaw sandbox activity and Paperline audit correlation without retaining sensitive document content.

Do not run installation scripts, create sandboxes, change providers, or mutate network/credential policies without explicit approval. When hardware/platform constraints block local verification, produce an exact approved remote test plan and keep the integration status **Prepared / external verification required**.

### Integration test matrix

Add deterministic and runtime coverage for:

- MCP initialization and tool discovery
- authenticated and unauthenticated requests
- malformed/expired/revoked/wrong-workspace credentials
- member/admin scope differences
- guessed cross-workspace document/template/workflow IDs
- invalid JSON-RPC, unknown methods, oversized bodies, schema abuse, cancellation, and timeout
- pagination/result caps
- rate-limit `429` and limiter-unavailable `503`
- duplicate expensive calls and idempotent operation status
- approval creation, rejection, expiry, parameter mismatch, replay, and concurrent execution
- safe error/log redaction
- direct Hermes discovery, allowlisted tool use, and revocation
- NemoClaw/OpenShell allowed-host success, denied-host/method failure, and credential non-disclosure

Use MCP Inspector or an equivalent protocol client for deterministic transport testing, then verify with a real current Hermes client. A curl response or static mock is not sufficient evidence of Hermes integration.

## Phase 11 — recruiter and senior-developer evidence

Update the existing portfolio/readiness package rather than creating marketing-only duplicates.

Create a concise secure-runtime case-study section showing:

- the original deployed parser failure and why a local build missed it
- serverless/native dependency diagnosis
- cross-platform parser redesign and real parse/render runtime gate
- migration-before-code ordering for fail-closed rate limits
- service-role authorization and tenant-isolation test strategy
- atomic processing claims and denial-of-wallet controls
- liveness versus readiness distinction
- structured safe failures and observability
- staged CSP and rollback reasoning
- one shared MCP application boundary serving direct Hermes and NemoClaw/OpenShell-managed Hermes without bypassing tenant controls
- remote MCP authentication, tool scopes, protocol hardening, approval state machine, and revocation tests
- OpenShell credential isolation and network/MCP-method policy evidence
- exact tests and evidence links
- residual risks and conservative no-go decisions

For each recruiter-facing claim link to:

- code path
- automated test or validation command
- candidate deployment/runtime evidence when available
- limitation or residual risk

Keep it readable by a recruiter in two minutes and defensible under senior-engineer questioning. Do not publish commit SHAs, deployment claims, or screenshots until they exist and are approved.

## Required durable artifacts

Create or update:

- `docs/readiness-tracker.md`
- `docs/security/security-audit.md`
- `docs/security/threat-model.md`
- `docs/qa/test-strategy.md`
- a runtime test matrix under `docs/qa/`
- `docs/release/production-readiness.md`
- a secure-runtime deployment/rollback runbook under `docs/release/`
- an environment/configuration matrix using names only
- a Paperline MCP integration specification with tool schemas, scopes, limits, approval classes, and versioning policy
- direct Hermes setup/revocation documentation using the current official Hermes MCP workflow
- NemoClaw/OpenShell managed-MCP setup and verification documentation referencing the current official NemoClaw for Hermes guide
- an agent-integration threat model covering bearer/OAuth credentials, confused deputy risk, tool poisoning, prompt injection, replay, approval bypass, denial of wallet, and sandbox egress
- `docs/portfolio/presentation-claims-audit.md`
- `docs/portfolio/case-study.md`
- automated tests/validators for every new runtime invariant

Do not duplicate existing artifacts when a focused update is clearer.

## Canonical release gates

Run each independently after the final code/document edit and preserve exact exit results:

```bash
pnpm install --frozen-lockfile
pnpm test:templates
pnpm test:extraction-eval
pnpm test:demo
pnpm test:security
pnpm test:readiness
pnpm test:parser-runtime
# Add and run a focused MCP/integration command (for example `pnpm test:mcp`)
# once the integration implementation exists; do not add a fake passing stub.
pnpm lint
pnpm build
pnpm audit --prod --audit-level=high
git diff --check
```

Also require:

- final tracked + untracked-but-not-ignored release-candidate secret scan
- Git-history secret scan before push
- migration parity evidence
- parser text+render evidence in the candidate runtime
- two-user/two-workspace authorization matrix
- rate-limit and concurrent-processing evidence
- signed-in browser smoke journey
- mobile and accessibility evidence
- CSP report-only evidence before enforcement
- liveness/readiness/monitoring evidence
- direct Hermes MCP discovery/invocation/revocation evidence
- NemoClaw/OpenShell managed-MCP policy, credential-isolation, allowed-call, and denied-call evidence
- full diff and generated/private-file review
- no unresolved confirmed Critical/High issue

A command wrapper is not evidence unless the real command ran and its meaningful output was inspected.

## Deployment sequence and approval gates

Use this order; stop before every external write until explicitly approved:

1. Complete local code, tests, docs, and diff review.
2. Present migration review and request approval for the non-production target.
3. Apply `0011` then `0012`; verify parity and rollback/forward-fix plan.
4. Present candidate deployment plan and request approval.
5. Capture the previous deployment identity.
6. Deploy once to the approved candidate scope.
7. Verify deployment identity, environment scope, logs, parser runtime, readiness, auth, tenancy, rate limits, and signed-in journey.
8. Fix and redeploy only with a documented reason and approval if required.
9. Present the direct Hermes MCP endpoint/auth/tool plan and request approval before creating external credentials or publishing an endpoint.
10. Present the NemoClaw/OpenShell sandbox/provider/network-policy plan and request approval before installation or policy mutation.
11. Verify both agent-consumption modes against the approved candidate endpoint.
12. Present a production go/no-go with residual risks.
13. Request separate approval for production alias promotion, production migration/config changes, Git push, catalog submission, or public publication.

Never deploy code that requires `0012` before the RPC exists in the target database.

## Definition of done

This goal is complete only when:

1. The complete authenticated runtime path is mapped and verified in an approved candidate environment.
2. Migrations `0011` and `0012` are applied to that target in the correct order and their behavior is tested.
3. PDF text extraction and scanned-page rendering run successfully in the target serverless runtime.
4. Representative PDF, scanned PDF, DOCX, TXT, PNG, and JPEG documents complete bounded processing or produce expected stable failures.
5. Two synthetic users/workspaces pass positive and negative tenant-isolation tests.
6. Member/admin service-role query boundaries are verified at runtime.
7. Rate limiting, atomic process claims, retries, cleanup, and usage accounting are tested under concurrency/failure.
8. Clerk candidate configuration has correct origins/redirects and no development-mode warning for a production-target release.
9. Liveness is honest, readiness is safe, and at least one synthetic failure is observable by the assigned owner.
10. Critical browser, mobile, keyboard, and accessibility journeys pass with limitations recorded.
11. CSP is at least exercised report-only; enforcement occurs only after compatibility proof.
12. Canonical gates, dependency checks, secret scans, build, and diff review pass after the final edit.
13. Rollback and migration forward-fix steps are tested or operationally verified without destructive data changes.
14. Recruiter artifacts link senior-level claims to code, tests, runtime evidence, and honest limitations.
15. A current direct Hermes client can discover the approved Paperline tools, perform an authorized synthetic read/citation operation, and lose access immediately after revocation.
16. A NemoClaw-managed Hermes sandbox can use the same Paperline MCP endpoint through OpenShell-held credentials and explicit MCP network/method policy, while denied egress/method and credential non-disclosure tests pass.
17. Expensive and consequential MCP tools obey tenant authorization, rate limits, idempotency, atomic claims, human approval, audit, and stable-error rules.
18. Paperline's UI/docs clearly distinguish direct Hermes support, NemoClaw/OpenShell support, demo fixtures, and any still-Planned capabilities.
19. A final **GO**, **CONDITIONAL GO**, or **NO-GO** decision is supported by evidence.
20. No production deployment, migration, push, domain change, sandbox/provider policy change, catalog submission, or publication occurs without explicit approval.

If candidate credentials, synthetic accounts, or dashboard approval are unavailable, mark affected items **Blocked**, finish all safe local work, and return the exact access/approval required. Do not weaken the definition of done.

## Final report format

Return:

1. **Runtime go/no-go decision** and rationale
2. **Architecture and trust-boundary changes**
3. **Security findings and remediations**, with exploit/user-impact path
4. **Database/RLS/storage evidence** and migration parity
5. **Parser/serverless runtime results** by file type
6. **Auth/tenant/concurrency/rate-limit test results**
7. **Liveness/readiness/observability results**
8. **Browser/mobile/accessibility/CSP results**
9. **Exact commands, deployment IDs/URLs, and exit results** without secrets
10. **Files changed**, separating pre-existing work from this goal
11. **Recruiter-ready evidence** and defensible senior-engineering talking points
12. **Direct Hermes MCP integration results**: auth, tools, scopes, revocation, and user setup
13. **NemoClaw/OpenShell results**: versions, sandbox, credential boundary, policy, allowed/denied tests, and audit correlation
14. **Residual risks and limitations** by severity
15. **Rollback and incident-response readiness**
16. **Approval-required next actions**

Do not declare the secure runtime path complete from local tests alone. Verify the actual approved target or report the external blocker precisely.
