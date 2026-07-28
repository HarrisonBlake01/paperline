# Paperline secure-runtime test matrix

Status reviewed: 2026-07-19 CDT. **Local contract evidence is not candidate-runtime evidence.**

| Boundary | Positive case | Negative / abuse case | Local evidence | Candidate evidence required | Status |
| --- | --- | --- | --- | --- | --- |
| Clerk/proxy | Signed-in user reaches workspace pages. | Signed-out user, stale session, wrong redirect origin. | Proxy/source and prior signed-out HTTP checks. | Two approved synthetic users; browser console/network; no development-key warning. | External verification required |
| Workspace authorization | Member reads own workspace objects; admin manages credentials. | Guessed UUID, foreign workspace, member admin action, removed membership. | Route source invariants and MCP fake-repository tenant assertions. | Two-user/two-workspace matrix across all service-role routes. | External verification required |
| Supabase/RLS | Authorized rows and relationships succeed. | Foreign row/object, inconsistent FK, direct anon access, unsafe RPC grant. | Migrations 0011–0013 parse/source checks. | Apply in order to approved target and execute positive/negative SQL/API/storage tests. | Blocked on migration approval |
| Private storage | Workspace object uploads/downloads through authorized server path. | Public bucket, traversal key, foreign object, DB failure after upload. | Upload validation and cleanup source tests. | Candidate bucket metadata and synthetic object isolation/cleanup. | External verification required |
| PDF text parser | Synthetic text PDF yields bounded pages/text. | Malformed/truncated/encrypted/oversized PDF. | `pnpm test:parser-runtime`. | Vercel candidate parse, duration, memory, logs, stable errors. | Local pass |
| Scanned PDF/image | Pages render and OCR preparation is bounded. | Oversized dimensions/pages, provider timeout/rate limit/malformed output. | Parser runtime render bytes and security invariants. | Candidate PDF/PNG/JPEG smoke using approved test provider budget. | Local pass |
| DOCX/TXT | Valid synthetic documents parse. | Generic ZIP, signature mismatch, zero-byte, oversized text. | Upload/parser regression scripts. | Candidate upload/process states and stable errors. | Local pass / candidate pending |
| Processing claim | One queued/failed document claims processing once. | Concurrent retry produces duplicate provider work/usage. | Atomic source invariant. | Database-backed concurrent requests and provider-call/usage evidence. | External verification required |
| Workspace rate limit | Request within fixed window succeeds. | Exhaustion returns `429`/`Retry-After`; RPC failure returns `503`; concurrent calls remain atomic. | `pnpm test:security`, `pnpm test:mcp`; migration 0012 source. | Migration-backed concurrency/failure test. | Local contract pass |
| Readiness | Independent bearer receives named dependency checks. | Missing/wrong token; DB/schema/storage/parser failure returns bounded 401/503. | `pnpm test:readiness`; `/api/readiness` route. | Candidate secret store, monitor, alert delivery, synthetic failure. | Local pass / monitor pending |
| MCP credential | Active scoped credential authenticates on Free and paid plans. | Malformed, expired, revoked, unscoped, unknown scope, removed member, or unknown/ineligible plan. | `pnpm test:mcp`. | Candidate UI creation/revocation and database-backed propagation. | Local pass |
| MCP tenant binding | Credential lists its own docs/citations/templates. | Model supplies foreign document/template UUID or tries workspace substitution. | SDK client and fake-repository assertions; repository workspace predicates. | Direct Hermes against synthetic A/B workspaces. | Local contract pass |
| MCP protocol | Initialize, discovery, and bounded tool call succeed. | Bad host/origin/type/JSON/version/method, oversized body, batch, limiter failure. | Official SDK in-memory client plus Web Standard Streamable HTTP tests. | Real HTTPS candidate via current Hermes client. | Local pass |
| MCP tool safety | Four scope-filtered read-only tools return bounded untrusted data. | Write scope, arbitrary URL/SQL/storage/shell, prompt injection, sampling/resources/prompts. | Exact tool-list assertion, read-only annotations, injection strings. | Real model adversarial prompts and log/audit inspection. | Local pass / adversarial runtime pending |
| Direct Hermes | Current Hermes discovers and invokes authorized Paperline tools. | Tool not allowlisted; revoked token; foreign UUID; secret in config/log. | Setup/runbook only—no integration claim. | Isolated real Hermes profile, `hermes mcp test`, read/citation, revoke-next-call. | Blocked on candidate/credential approval |
| NemoClaw/OpenShell | Managed Hermes reaches same HTTPS MCP endpoint. | Unapproved host/method; sandbox reads token; stale credential after revoke. | Official-doc architecture/runbook only. | Approved sandbox/provider policy, generated-policy review, allowed/denied calls, credential isolation. | Blocked on sandbox/policy approval |
| Consequential agent action | None exposed in first release. | Agent self-approves, replays, changes parameters, causes spend/outbound action. | Absence of mutating MCP tools; read-only annotations. | Durable approval/idempotency state machine before any such tool is enabled. | Planned |
| Browser/mobile/a11y | Public audited routes remain usable. | Signed-in failure states, keyboard/focus, zoom/overflow. | Prior public Lighthouse evidence. | Candidate signed-in mobile/desktop/manual accessibility journey. | External verification required |
| CSP | Reviewed origins run under report-only policy. | Auth/billing breakage or broad wildcard/unsafe policy. | No new policy claimed. | Candidate violation collection and classification before enforcement. | Blocked on candidate origins |
| Rollback/incident | Known-good artifact and forward-fix plan restore service. | Migration/data loss, credential leak, cross-tenant incident. | Documented runbook. | Candidate rollback drill, alert owner, credential rotation drill. | External verification required |

## Canonical local commands

Run independently after the final edit:

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

Secret scans, migration parity, candidate parser evidence, signed-in tests, direct Hermes, and NemoClaw/OpenShell verification remain separate required gates.
