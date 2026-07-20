# Paperline agent-integration threat model

Review date: 2026-07-19
Status: local engineering model; not a penetration test or certification

## Scope

This model covers direct Hermes and NemoClaw/OpenShell-managed Hermes access to Paperline through `/api/mcp`. It supplements [`threat-model.md`](threat-model.md).

## Trust boundaries

1. **Hermes client boundary** — the model can select exposed tools, but cannot determine identity, workspace, role, or scope.
2. **Bearer credential boundary** — a high-entropy secret identifies one credential creator and workspace; the plaintext exists only at creation/client credential stores.
3. **MCP transport boundary** — untrusted HTTP headers and JSON-RPC bodies cross into the official MCP SDK.
4. **Paperline authorization boundary** — current membership, plan, expiry, revocation, and scopes are checked before tool registration.
5. **Service-role boundary** — Supabase service-role access bypasses RLS, so every repository query must use the credential-derived workspace.
6. **Document-data boundary** — filenames, templates, chunks, citations, and model output are untrusted data, not policy or authorization.
7. **OpenShell boundary** — in NemoClaw mode, credential replacement and egress policy occur outside the Hermes sandbox.

## Assets

- private source documents, chunks, citations, extraction results, and metadata
- credential plaintext, digest, scopes, expiry, creator, and usage timestamps
- workspace membership/role and plan state
- service-role and provider credentials
- MCP tool schemas, audit events, operation IDs, and rate-limit state
- OpenShell provider credentials, generated policies, sandbox config, and activity logs

## Threats, controls, and residual risk

| Threat | Concrete exploit path | Current local controls | Residual risk / required proof |
| --- | --- | --- | --- |
| Credential theft/replay | Token copied from config, history, logs, or sandbox and reused remotely. | 256-bit random token, one-time display, digest-only DB storage, 30-day expiry, revocation, no URL credentials, no token logging. | Static bearer has no proof-of-possession. Verify secret-store handling and rotation; OAuth/mTLS remain future options. |
| Cross-workspace confused deputy | Agent supplies a foreign document ID or `workspace_id` while server uses service role. | Workspace is derived only from credential; tools do not accept workspace ID; every repository query filters workspace; foreign IDs return stable not-found. | Requires migration-backed two-workspace tests and route/repository review for every future tool. |
| Stale privilege | Creator removed, role changed, workspace becomes ineligible, key revoked/expired. | Membership, role validity, plan eligibility, revocation, expiry, and scopes checked on every request. MCP/API is currently included on all active plans. | Test propagation against real Clerk→Supabase synchronization and concurrent revocation. |
| Scope escalation | Model calls an ungranted tool or supplies scope in arguments. | Server registers tools only for DB scopes; no scope argument; constrained scope vocabulary. | OpenShell method policy does not allowlist individual tools, so Paperline registration must remain authoritative. |
| Prompt injection/tool poisoning | Document says to reveal secrets, override rules, or call another tool. | Read-only first surface; untrusted-data descriptions/envelopes; bounded snippets; no credentials in tool output; no sampling/resources/prompts. | Client model can still mishandle malicious content. Add adversarial real-model evaluation and retain human review for consequential actions. |
| Denial of wallet/resource exhaustion | Repeated initialize/list/call, huge JSON, high pagination, parallel calls. | 128 KiB body cap, no batches, max 50 rows, max 500-char snippets, stateless requests, DB-backed workspace limiter, Hermes parallel calls disabled in docs. | Validate limiter migration under concurrency; add per-tool cost tiers before mutations. |
| Protocol parser abuse | Malformed JSON-RPC, invalid version, unknown method, body nesting. | Official SDK 1.29.0, exact JSON content type, UTF-8 parse, size cap, batch rejection, stable errors. | Monitor SDK advisories and fuzz protocol boundary. Size cap limits but does not prove parser safety. |
| DNS rebinding/host confusion | Browser or proxy sends hostile Host/Origin; sandbox endpoint resolves private IP. | Production host allowlist, explicit Origin rejection, no wildcard CORS. NemoClaw requires public HTTPS DNS, canonical path, pinned IP policy, and fail-closed re-resolution. | Candidate proxy/alias behavior and OpenShell generated policy require runtime proof. |
| Audit/telemetry leakage | Logs contain token, prompts, document text, or tenant-identifying data. | Logs use credential ID/tool/error type/provider code; audit metadata excludes arguments/content/token; stable client errors. | Configure Sentry/log scrubbing and retention; inspect candidate logs with synthetic injection strings. |
| Audit bypass | Tool succeeds but audit insert fails. | Safe warning records provider code; primary operation is not silently retried. | Decide production policy: fail closed for consequential mutations; read-only tools currently prioritize availability. External immutable log sink is not connected. |
| Batch/quota bypass | Multiple tool calls in one JSON-RPC array consume one rate-limit unit. | JSON-RPC batches rejected. | A client can still send concurrent single requests; verify atomic DB limiter and Hermes sequential default. |
| Approval bypass | Agent directly triggers extraction/workflow/spend or self-approves. | No mutating/external-action MCP tools exist in first release. | Before adding them, implement immutable proposed action, separate approver identity, parameter hash, expiry, atomic execution, and replay tests. |
| Sandbox credential disclosure | Hermes reads raw bearer from `/sandbox/.hermes` or process environment. | Planned NemoClaw managed-MCP path stores credential in OpenShell provider and exposes only resolver placeholder. | Must prove in approved sandbox; Paperline cannot enforce host credential-store behavior. |
| SSRF through MCP | Tool accepts arbitrary URL or storage location. | No URL/file/storage-path tool arguments; endpoint itself has fixed repository operations. | Re-review every future connector or webhook tool. |
| Supply-chain compromise | SDK, parser, blueprint, or MCP catalog package is compromised. | Lockfile, exact MCP SDK version, audit gate, NemoClaw digest/version verification requirement, no catalog installation. | One moderate production advisory remains; upstream monitoring and candidate SBOM/signing are future maturity work. |

## Security invariants

- `workspaceId`, user ID, role, and scopes originate from authenticated server-side state only.
- Empty, unknown, expired, revoked, or migration-incomplete credentials fail closed.
- Existing unscoped API keys never become MCP credentials automatically.
- No service-role query uses a model-supplied workspace.
- No first-release tool performs mutation, provider inference, network fetch, shell execution, or spend.
- No returned document/template text is trusted as instruction.
- No OpenShell policy claim is considered verified until generated policy and denied-call evidence are captured.

## Mandatory negative tests before candidate GO

1. Missing, malformed, expired, revoked, unscoped, unknown-scope, and unknown/ineligible-plan credentials; verify Free credentials succeed.
2. Creator removed from workspace and role downgraded.
3. Workspace A credential requests Workspace B document/chunk/template UUIDs.
4. Host mismatch, unapproved browser Origin, wrong content type, invalid UTF-8/JSON-RPC, unknown method/version, batch, and oversized body.
5. Limiter unavailable, exhausted, and concurrently consumed.
6. Prompt-injection strings in filenames, template descriptions, and citation snippets.
7. Logs/audit searched for token, Authorization header, document text, prompt, and provider payload.
8. Direct Hermes tool allowlist excludes every unapproved capability and sampling/resources/prompts.
9. OpenShell denies unapproved host/method and sandbox cannot resolve/read the raw credential.
10. Revocation takes effect on the next direct and sandboxed call.

## Claims boundary

Local code and deterministic SDK tests support **Implemented locally**. Direct Hermes, NemoClaw, and OpenShell support remain **Prepared / external verification required** until migrations, candidate deployment, real Hermes calls, managed sandbox policy, credential isolation, denied egress, and revocation are verified end to end.
