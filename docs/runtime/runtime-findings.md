# Secure runtime findings ledger

Review date: 2026-07-19 CDT
Goal baseline: `main` at `6056d70`, one pre-existing untracked goal file, no tracked modifications
Baseline evidence: `/tmp/paperline-secure-runtime-baseline.patch` and `/tmp/paperline-secure-runtime-baseline-status.txt` for this session only

Status terms: **Complete locally**, **Prepared / external verification required**, **Blocked**, **Follow-up**.

| ID | Severity | Finding and evidence | Remediation | Verification | Status / dependency |
| --- | --- | --- | --- | --- | --- |
| RT-01 | High availability | Vercel production deployment `dpl_AabZzxqmxSsMHSGpdXodpMiu7pAx` was created 2026-06-22 and predates local parser/security/MCP work. Public `/api/health` still returns the older `env_missing` shape. | Prepare immutable candidate deployment, verify identity, then smoke actual parser/readiness/auth/MCP paths. | `vercel inspect`; read-only HTTP probe. | **Blocked** pending explicit deployment approval. |
| RT-02 | High release sequencing | Remote migration history is `0001`–`0010`; local `0011`, `0012`, and `0013` are absent. Current rate-limit, hardened RLS, scoped credentials, integrations page, MCP, and readiness code depend on them. | Review/apply `0011`→`0012`→`0013` in an approved non-production target before candidate code. | `pnpm supabase migration list`; `pglast` parses all new SQL. | **Blocked** pending explicit migration approval and safe target. |
| RT-03 | Medium availability | Existing production processing previously failed loading PDF native canvas; local parser uses lazy `pdf-parse`, server-externalized native package, and Linux-compatible rendering. | Deploy candidate and process PDF/scanned PDF plus DOCX/TXT/PNG/JPEG fixtures. | `pnpm test:parser-runtime`: 11 pages and 243,767 rendered bytes. | **Prepared / external verification required**. |
| RT-04 | Medium observability | Public liveness was previously interpreted as readiness while dependencies failed. | Keep `/api/health` liveness-only; added bearer-protected `/api/readiness` covering config, DB, migrations 0012/0013, private storage, and PDF runtime. | Behavioral readiness tests and build route inventory. | **Complete locally**; monitor/token/candidate evidence blocked on approval. |
| RT-05 | Medium agent security | Baseline API keys were unused, unscoped, non-expiring foundations; no MCP endpoint existed. | Added migration `0013`, scoped/expiring `pl_mcp_` credentials, current membership/plan checks, official SDK Streamable HTTP route, bounded read-only tools, audit, and rate limits. | `pnpm test:mcp`; `pnpm test:security`; build includes `/api/mcp`. | **Complete locally**; direct Hermes and NemoClaw/OpenShell remain external verification. |
| RT-06 | High tenant isolation | No real two-user/two-workspace signed-in or bearer-auth matrix exists against a database. | Create synthetic A/B users/workspaces, foreign IDs, member/admin roles, token revocation/expiry, and negative storage/RLS tests. | Deterministic fake-repository tests prove code contracts only. | **Blocked** pending approved synthetic identities and migration target. |
| RT-07 | Medium browser hardening | Strict CSP is not staged against real Clerk/Stripe/Supabase/telemetry origins. | Candidate `Content-Security-Policy-Report-Only`, violation capture, then tighten/enforce after auth/billing QA. | Header/browser inspection. | **Blocked** pending candidate domain/config; do not improvise wildcard policy. |
| RT-08 | Medium reliability/cost | Upload processing remains awaited inside a 300-second serverless request; it is tracked but not a durable queue. | Retain current safe tracked behavior for controlled scale; design queue claim/retry/dead-letter/idempotency before public throughput. | Process conflict and source regressions. | **Follow-up for controlled candidate; blocker for unrestricted scale**. |
| RT-09 | Low/Medium webhook replay | Stripe/Clerk signatures are verified, but there is no durable processed-event ledger. | Add unique provider/event IDs, bounded retention, idempotent handlers, replay/out-of-order tests. | Synthetic signed webhook harness. | **Follow-up before unrestricted scale**. |
| RT-10 | High launch config | The stable recruiter alias `paperline-xi.vercel.app` runs an older tree and recorded Clerk development keys; `paperline.io` is reserved for a separate future commercial project. | Reconcile recruiter-only Clerk/provider resources, exact app/webhook/MCP origins, Node 22, and Stripe test mode; stage the immutable commit without moving the alias. | Dashboard and immutable recruiter-candidate verification. | **Blocked** pending explicit provider/deployment approval; commercial domain work frozen. |
| RT-11 | Medium product evidence | Signed-in upload→process→extract→chat→workflow journey has not been rerun. Offline extraction sample is 40% exact / 75% normalized, not production accuracy evidence. | Execute risk-based synthetic E2E and preserve fixture/expected/observed evidence. | Existing local deterministic gates only. | **Blocked for production claims**. |
| RT-12 | Medium agent protocol | Direct SDK tests pass, but no real current Hermes client or NemoClaw-managed Hermes sandbox has called the endpoint. | After approved candidate: direct Hermes discovery/call/revoke; then managed-MCP add, policy review, allowed/denied calls, credential non-disclosure, rotation/revocation. | Exact commands and redacted logs required. | **Prepared / external verification required**. |
| RT-13 | Medium consequential actions | First MCP release is intentionally read-only. Extraction/workflow/spend approval state machine is not implemented. | Add durable proposed action, separate approver, normalized parameter hash, expiry, cost ceiling, atomic execution, idempotency, and audit before any mutating tool. | Concurrency/replay/approval tests. | **Planned**; not represented as current capability. |
| RT-14 | Medium auth maturity | Static bearer supports current Hermes and managed OpenShell credential replacement but lacks OAuth refresh/step-up/proof-of-possession. | Evaluate MCP OAuth 2.1 metadata, DCR/registered client, PKCE, scopes, refresh/revocation, and Hermes `auth: oauth`. | Real Hermes login/refresh/revoke tests. | **Planned** after bearer candidate; residual risk documented. |

## Baseline gate evidence

All commands were run individually before goal-specific implementation:

- `pnpm install --frozen-lockfile` — exit 0
- `pnpm test:templates` — exit 0
- `pnpm test:extraction-eval` — exit 0
- `pnpm test:demo` — exit 0
- `pnpm test:security` — exit 0
- `pnpm test:readiness` — exit 0
- `pnpm test:parser-runtime` — exit 0
- `pnpm lint` — exit 0
- `pnpm build` — exit 0
- `pnpm audit --prod --audit-level=high` — exit 0, one Moderate
- `git diff --check` — exit 0

## Goal-specific local gate evidence

After implementation and documentation changes, all canonical commands were run independently on 2026-07-19 UTC and returned exit 0:

- frozen install
- templates, extraction evaluation, demo, security, readiness, parser-runtime, and MCP tests
- ESLint and Next.js production build
- production dependency audit at the High threshold (one Moderate remains)
- diff whitespace check
- release-candidate scan of 232 tracked plus untracked/non-ignored files: no leaks
- 21-commit Git-history scan: no leaks

The final report preserves exact timestamps and meaningful output. This ledger does not authorize migration, deployment, credential creation, sandbox policy mutation, commit, push, catalog submission, or publication.
