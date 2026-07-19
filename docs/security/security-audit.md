# Paperline application-security review

Review date: 2026-07-18 CDT  
Scope: current local working tree, current Git history/configuration, and read-only checks of `https://paperline-xi.vercel.app/`.

This is an internal engineering review, not a third-party penetration test or certification.

## Executive result

The review found and remediated one confirmed High dependency issue and several Medium application-hardening issues. No confirmed direct cross-workspace data disclosure was reproduced. Public production launch remains **NO-GO** because the new RLS and rate-limit migrations are not applied, the repaired parser runtime is not deployed, production auth/domain configuration is unresolved, and the signed-in SaaS path still requires controlled end-to-end verification.

## Confirmed findings remediated

### SEC-01 — vulnerable Next.js proxy path (High)

- **Evidence:** baseline production audit identified Next.js 16.2.5 under GHSA-26hh-7cqf-hhc6.
- **Impact:** affected App Router proxy/middleware authorization assumptions.
- **Fix:** upgraded to Next.js 16.2.10; removed the misleading `x-internal-trigger` proxy exception.
- **Regression:** `pnpm test:security`, production dependency audit at High threshold, protected-route HTTP checks.

### SEC-02 — file-type trust and unsafe upload relationships (Medium)

- **Evidence:** upload route trusted `File.type` and accepted an arbitrary folder UUID.
- **Impact:** malformed content reached parsers; a cross-workspace folder reference could be attempted through the service-role path.
- **Fix:** content signatures, size/empty checks, DOCX ZIP markers, bounded text validation, filename normalization, workspace-scoped folder check, and orphan cleanup.
- **Regression:** behavioral cases in `scripts/validate-security.ts`.

### SEC-03 — tenant relationship and SECURITY DEFINER hardening (Medium)

- **Evidence:** baseline RLS join policies checked the owning chat/workflow/document but not always the opposite foreign-key row. Helper functions did not pin `search_path`.
- **Impact:** an authenticated direct Supabase client could attempt cross-tenant relationship poisoning; unsafe definer search paths weaken defense in depth.
- **Fix:** `supabase/migrations/0011_security_hardening.sql` adds cross-tenant `WITH CHECK` predicates, fixed search paths, and narrowed execute grants.
- **Verification limitation:** migration has not been applied to production because DB changes require explicit approval.

### SEC-04 — internal error and configuration disclosure (Medium)

- **Evidence:** multiple API responses returned Supabase/provider `.message` values; production health named missing environment variables; classification development logs included document excerpts.
- **Fix:** stable public error codes, bounded internal metadata, production health redaction, and no excerpt preview logging.

### SEC-05 — unreliable serverless processing lifecycle (Medium correctness/availability)

- **Evidence:** upload returned while `void processDocument()` continued without a tracked serverless lifetime.
- **Impact:** files could remain queued if the runtime froze after response.
- **Fix:** processing is awaited, bounded by a 300-second route duration, and the final document state is returned.
- **Residual:** a durable queue is still recommended for throughput/retries.

### SEC-06 — Stripe fail-safe gaps (Medium)

- **Evidence:** webhook plan metadata was cast without validation; workspace update did not verify the Stripe customer; any valid secret-key mode was accepted.
- **Fix:** plan allowlist, customer↔workspace binding, test keys by default, explicit live-mode opt-in, and generic webhook errors.

### SEC-07 — response hardening and accessibility-adjacent browser controls (Low/Medium)

- **Fix:** application-owned security headers, API no-store, hidden framework header, contrast-safe solid accent, main landmarks.
- **CSP:** deliberately not improvised. It remains a staged production task due to Clerk/provider/nonce requirements.

### SEC-08 — malformed resource IDs and tenant-prefiltering (Low)

- **Evidence:** dynamic API path IDs were passed to UUID database columns without an explicit format check; editable-template reads fetched by ID before comparing workspace ownership.
- **Impact:** malformed IDs could produce avoidable database errors, and known foreign IDs created an existence oracle even though row contents were not returned.
- **Fix:** shared UUID parsing now returns stable 400 responses on every dynamic API route; editable-template reads and mutations include workspace and built-in predicates in the query itself.
- **Regression:** behavioral UUID helper cases plus route/source invariants in `pnpm test:security`.

### SEC-09 — duplicate processing and stored provider-detail exposure (Medium)

- **Evidence:** document processing changed status in a separate unconditional update, so concurrent requests could perform duplicate OCR/AI/usage side effects. Raw provider/parser messages were stored and rendered in authenticated document and extraction views.
- **Impact:** authenticated request races could duplicate cost and usage accounting; internal provider details could reach workspace users.
- **Fix:** processing now atomically claims only queued/failed documents, conditionally finalizes the claimed state, stores stable failure codes, logs bounded error metadata, and renders generic user guidance.
- **Regression:** failure-code behavior, atomic-claim source invariant, bounded-log assertion, and raw-error-render assertions in `pnpm test:security`.

### SEC-13 — service-role admin-metadata disclosure (Medium)

- **Evidence:** member-accessible settings and integrations server components queried audit logs and API-key metadata through the service-role client, bypassing the database's admin-only read policy.
- **Impact:** a workspace member could see audit activity, member Clerk identifiers, and API-key names/prefixes/usage timestamps, but not full key secrets.
- **Fix:** privileged settings/integrations queries now execute only for owner/admin roles; member views receive no privileged rows.
- **Regression:** role-gate source assertions in `pnpm test:security`; signed-in member verification remains required.

### SEC-14 — serverless PDF runtime failure (Medium availability)

- **Evidence:** the deployed process route logged missing `@napi-rs/canvas`/`DOMMatrix`; scanned-PDF rendering depended on macOS Swift/AppKit.
- **Fix:** PDF dependencies are lazy-loaded, native packages are server-externalized, parser instances are destroyed deterministically, and scanned pages render to PNG through `pdf-parse` on the Node runtime.
- **Regression:** `pnpm test:parser-runtime` parses 11 text pages and renders a real first-page PNG without invoking a paid AI provider.
- **Verification limitation:** the fix is local and must pass an approved Vercel deployment smoke test.

### SEC-15 — AI trust boundaries and citation integrity (Low/Medium)

- **Evidence:** prompts did not explicitly classify document/schema text as untrusted; chat attached every retrieved chunk even when the generated answer did not cite it; OCR retry logs included raw provider messages.
- **Fix:** explicit untrusted-data delimiters/instructions, answer-reference citation filtering and numbering, and bounded OCR error-type logging.
- **Residual:** prompt instructions reduce—not eliminate—indirect prompt-injection risk; adversarial model tests remain required.

## Open production risks

1. **Durable rate-limit production state (Medium, launch blocker):** migration 0012 implements atomic per-workspace fixed-window limits and fail-closed route enforcement, but it must be applied and integration-tested. Atomic page/token quota reservation remains a scale follow-up beyond request limiting.
2. **CSP (Medium, hardened-launch blocker):** deploy report-only policy with exact Clerk/Supabase/Stripe/telemetry origins, observe, then enforce.
3. **Webhook replay ledger (Low/Medium):** persist processed Stripe/Clerk event IDs with unique constraints and retention.
4. **Parser sandboxing/decompression controls (Medium at public scale):** signature checks do not make complex parsers memory-safe.
5. **Production data lifecycle (Medium):** retention, deletion, backup/restore, incident response, and object cleanup need operational proof.
6. **RLS production state (Medium):** apply and negative-test migration 0011 before relying on it.
7. **Parser deployment parity (Medium):** local text/render runtime checks pass, but Vercel must be tested with representative PDF, scanned PDF, DOCX, TXT, PNG, and JPEG files.
8. **Monitoring semantics (Medium):** `/api/health` is intentionally liveness-only; add a protected dependency-readiness probe and external uptime/error monitoring before launch.

## Secret and supply-chain evidence

- Gitleaks 8.30.1 scanned 20 Git commits: 0 findings.
- Gitleaks scanned the final 216-file tracked + untracked-but-not-ignored release candidate: 0 findings.
- Existing ignored `.env.local` and generated `.next` output were deliberately excluded from the release-candidate scan; values were never printed or committed.
- Baseline `pnpm audit --prod`: 12 High, 19 Moderate, 5 Low, 0 Critical.
- After compatible dependency refresh and Next.js 16.2.10: 0 Critical, 0 High, 1 Moderate, 0 Low.
- Remaining advisory is transitive PostCSS through Next.js; the High-threshold release gate passes, but the advisory remains monitored.

A repository-history secret scan and staged-diff review must be rerun immediately before push because the working tree contains substantial pre-existing uncommitted work.
