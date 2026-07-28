# Paperline pre-deployment test matrix — 2026-07-27

Status: **LOCAL GATE PASSED — recruiter provider/migration/runtime tests and future production tests remain gated. The public Olvera Productions support destination is deployed and verified.**

This is the execution checklist that must be completed before Paperline is deployed or attached to `paperline.io`. It separates local evidence from real candidate and production evidence. Passing source validators or a local build does not complete a candidate/runtime test.

## Deployment mapping

- **Recruiter/demo:** current Vercel project `paperline` (`prj_OfKl0NNnacxQ5pTX3X0QNhNkbrMc`), whose Vercel target is named `production`, served at `https://paperline-xi.vercel.app`. In this project, “Production” means the stable recruiter site—not the future commercial Paperline production environment.
- **Future product production:** `https://paperline.io`, reserved for a separately configured production deployment/project with production-only providers, approval gates, domain attachment, and DNS. It is not currently resolvable or attached.
- Keep recruiter/demo and future product production in separate Vercel projects so environment variables, databases, identity applications, Stripe modes, aliases, and deployment histories cannot be confused.

## Status vocabulary

- `[x] Complete locally` — executed against the current local candidate.
- `[c] Complete in candidate` — executed against the named deployed candidate and its isolated services.
- `[p] Complete in production` — executed against the immutable production deployment.
- `[ ] Not started` — safe to execute but not yet run.
- `[!] Blocked` — approval, authentication, provider setup, migration, or deployment is required.

## Test group 1 — candidate identity and supply-chain integrity

- [x] Record branch, base HEAD, dirty/staged state, tracked plus non-ignored untracked file count, and deterministic candidate manifest.
- [x] Verify `.env.local`, recruiter media, local agent state, Supabase temporary state, logs, and generated private artifacts are excluded from Git and Vercel uploads.
- [x] Run frozen dependency installation with `.env.local` isolated.
- [x] Run `pnpm audit --prod --audit-level=high` and require no High/Critical production vulnerability.
- [x] Run exact tracked plus non-ignored untracked Gitleaks scan.
- [x] Run Git-history Gitleaks scan separately.
- [x] Run `git diff --check`, changed/new text final-newline validation, and Actionlint.
- [!] Before deployment, require a clean reviewed Git commit/tree matching the recorded candidate; current tree is intentionally dirty and unstaged.
- [!] Push a non-production release branch and require hosted CI before merge or production deployment.

## Test group 2 — complete local quality and build gate

- [x] `pnpm test:templates`
- [x] `pnpm test:extraction-eval` — record exact/normalized field accuracy and list/presence F1.
- [x] `pnpm test:demo`
- [x] `pnpm test:security`
- [x] `pnpm test:lifecycle`
- [x] `pnpm test:lifecycle-db`
- [x] `pnpm test:readiness`
- [x] `pnpm test:parser-runtime`
- [x] `pnpm test:mcp`
- [x] `pnpm lint`
- [x] CI-placeholder `pnpm build` with live Stripe disabled; require the expected public/app/API route table.
- [x] Verify the current footer Support link is rendered and targets `https://olveraproductions.com/support`.

## Test group 3 — migration and database behavior

- [x] Apply migrations `0014`–`0018` to disposable PostgreSQL and run behavior tests, including internal cleanup-queue privilege/cascade checks.
- [x] Prove migration `0017` fails closed on ownerless legacy `deleting` state.
- [x] Prove workspace deletion claim, renewal, destructive resume, stale takeover, non-release, and finalization.
- [x] Prove document deletion waits for operation leases and preserves chats still linked to another document.
- [x] Prove billing-operation stale recovery and deterministic checkout-operation persistence.
- [!] Query the target Supabase project for ownerless legacy deleting rows before migration `0017`; inspect any result manually.
- [!] Capture database backup/rollback evidence and Storage-object backup residual before migration.
- [!] Apply migrations `0017` and `0018` in order only after separate migration approval; read back migration history, constraints, RPCs, lifecycle columns, and cleanup-queue privilege/state.
- [!] Run the mutation-enabled candidate database probe against the exact approved project reference and prove cleanup/baseline restoration.

## Test group 4 — authentication, authorization, and tenant isolation

- [x] Verify signed-out `/dashboard`, `/documents`, `/templates`, `/workflows`, `/settings`, and `/integrations` redirect to the app-domain sign-in route locally.
- [!] Replace development Clerk keys with production/candidate keys and verify origins, redirects, session persistence, sign-out, and webhook signature handling.
- [!] Use two synthetic users in separate workspaces and verify each positive journey.
- [!] Prove Workspace A cannot discover or mutate Workspace B documents, chunks, templates, chats, workflows, storage objects, audit data, API keys, billing metadata, or lifecycle state.
- [!] Verify owner/admin/member authorization for membership, billing, API-key management, document deletion, and workspace deletion.
- [!] Verify missing and foreign IDs are nondisclosing and do not reveal resource existence.

## Test group 5 — critical user journeys and document processing

- [!] Sign up, sign in, onboarding, dashboard arrival, refresh persistence, and sign out.
- [!] Upload and process representative PDF, scanned PDF, DOCX, TXT, PNG, and JPEG fixtures.
- [!] Verify private storage path, tenant ownership, parser result, processing state, page count, usage accounting, and UI state after each upload.
- [!] Verify extraction with a built-in template and a custom template, including confidence and source citations.
- [!] Verify cited document chat and cross-document/workspace chat without unsupported answers.
- [!] Verify workflow creation/execution and quota/rate-limit behavior, including `429` and `Retry-After`.
- [!] Verify safe retries for dropped upload, process, checkout, document-delete, and workspace-delete responses.
- [!] Verify document deletion removes source/derived content but preserves shared chats.
- [!] Verify workspace deletion is resumable and irreversible after its destructive point of no return.
- [!] Run desktop, tablet, and mobile browser checks; keyboard navigation, focus visibility, headings, labels, contrast, and no horizontal overflow.
- [!] Require no unexpected browser-console errors or failed application network requests.

## Test group 6 — billing and Stripe lifecycle

- [x] Recruiter candidate launch decision: expose paid-plan and checkout UX in Stripe test mode only; live paid launch remains a separate future decision.
- [!] Keep OpenAI usage server-side on a dedicated restricted project key with a hard budget/rate limit; never expose the key or its payment method to recruiters. Server-side code path is verified; provider-project budget and scope remain candidate configuration gates.
- [x] Recruiter candidate code policy: when `PAPERLINE_RECRUITER_DEMO=true`, show a prominent no-charge test-mode notice and reject every live Stripe secret key even if `PAPERLINE_ALLOW_LIVE_STRIPE=true` is accidentally present.
- [!] On the deployed recruiter candidate, verify test Checkout/payment-method UX and prove that no live Stripe key, Price, Customer, payment method, or charge is reachable.
- [!] In Stripe test mode, verify customer/session idempotency across dropped responses and retries.
- [!] Verify a second logical operation cannot create a duplicate paid subscription.
- [!] Verify Checkout completion, billing portal access, cancellation, and entitlement changes.
- [!] Replay duplicate, reordered, mismatched, inactive, and terminal webhook events; require authoritative subscription reconciliation.
- [!] Verify every Stripe status against separate entitlement and workspace-deletion-blocking policies.
- [!] Verify open Checkout Sessions and blocking subscriptions prevent workspace deletion.
- [!] Verify deleting workspaces reject/cancel late billing events and cannot regain paid entitlement.
- [!] Configure and verify the production Stripe webhook only if paid launch is approved; do not retain a real charge.

## Test group 7 — MCP/API and machine credentials

- [x] Verify local protocol/auth/tenant/tool/rate-limit harness.
- [!] On the candidate, verify `/api/mcp` rejects missing, invalid, expired, and revoked credentials.
- [!] Verify the four advertised read-only tools through a real isolated Hermes client after discovery completes.
- [!] Prove foreign document/template IDs are denied without disclosure.
- [!] Verify credential creation scope, expiry, rotation, revocation, and next-request denial.
- [!] Verify sequential and concurrent rate limits fail closed.
- [!] Remove temporary client credentials, headers, response bodies, screenshots, and bypass material; scan the isolated profile for raw secrets.

## Test group 8 — public surfaces, runtime security, and support dependency

- [x] Verify public routes build: `/`, `/contact`, `/privacy`, `/terms`, `/status`, `/changelog`, and `/ops-agent`.
- [x] Verify the local Paperline footer Support link and local Olvera Productions `/support` page.
- [p] `https://olveraproductions.com/support` returns a working public `200` before releasing the Paperline footer that links to it. Olvera Productions deployment `dpl_GHBCpQ2bLcT9SGP2zEQPtrTTYC1p` is Ready and aliased to the production domain.
- [!] On the candidate, verify `/api/health` is safe and `no-store`; invalid `/api/readiness` returns `401`; valid readiness reports every dependency.
- [!] Verify HSTS/HTTPS, CSP decision, frame/content-type/referrer/permissions headers, and absence of `X-Powered-By`.
- [!] Verify upload size/type/signature mismatch, malformed/empty file, decompression/parser failure, and prompt-injection fixtures fail safely.
- [!] Verify logs, Sentry events, analytics, audit records, and webhook errors contain no document text, prompts, cookies, authorization headers, tokens, or secrets.

## Test group 9 — observability, rollback, backup, and launch operations

- [!] Assign a named human owner for Vercel/runtime, Clerk, Supabase, OpenAI, Stripe, security, deletion, and support incidents.
- [!] Deliver one synthetic alert through the actual monitoring path.
- [!] Capture the pre-deploy Vercel deployment/alias and document code rollback.
- [!] Verify database forward-fix procedure; do not destructively roll back migrations `0017`–`0018`.
- [!] Record database backup/PITR and Storage-object backup limits; obtain explicit residual-risk acceptance where needed.
- [!] Verify environment-variable inventory and target scopes without printing values.
- [!] Correct Vercel runtime from Node `24.x` to repository-pinned Node `22.x`; read back install/build commands.
- [!] Deploy the reviewed recruiter candidate to the current `paperline` Vercel project and require Ready state and safe logs. Promotion within that project affects `paperline-xi.vercel.app`, not `paperline.io`.
- [!] Complete every candidate test above before separate production approval.
- [!] Create/configure the separate future production Vercel project only after recruiter-candidate acceptance and separate approval.
- [!] After future production deployment, rerun public, auth, tenant, document, MCP, readiness, webhook, monitoring, rollback-eligibility, and browser smoke tests before attaching `paperline.io`.

## Deployment decision rule

Paperline remains **NO-GO** if any of the following is true:

1. A Critical/High/Medium correctness or tenant-isolation issue is open.
2. Migrations `0017`–`0018`, two-workspace isolation, destructive lifecycle, durable Storage cleanup, or billing lifecycle behavior is unverified on the target candidate.
3. Production auth/webhook/provider configuration is missing or uses development credentials.
4. The immutable deployed candidate does not match the reviewed Git tree and secret-scan evidence.
5. The support destination, health/readiness, monitoring, backup residual, or rollback path is unresolved.
6. Any separate approval for commit, push, migration, deployment, domain, or DNS is absent.

## Execution log

- 2026-07-27: Test matrix created. No external mutation authorized.
- 2026-07-27: Candidate identity recorded as local `main` HEAD `2d29bcce3131f38165b9da36e000dacea2e92f7a`, staged count `0`, and 45 changed/untracked status entries. Current deterministic manifest excluding the two self-referential release ledgers: `7792ff29272bbac6fd57f2c213f65f6edc8c3463bee78555d27adee03a278539` across 272 files.
- 2026-07-27: Complete clean local gate passed with `.env.local` isolated/restored and `PAPERLINE_ALLOW_LIVE_STRIPE=false`; final marker `PREDEPLOY_LOCAL_GATE_PASS`.
- 2026-07-27: Extraction evaluation recorded exact accuracy `40.00%`, normalized accuracy `75.00%`, presence F1 `94.12%`, and list-item F1 `85.71%`.
- 2026-07-27: Disposable PostgreSQL emitted `lifecycle-db-regressions-pass` and `lifecycle-legacy-preflight-pass`.
- 2026-07-27: Next.js `16.2.12` production build compiled in `6.0s`, completed TypeScript in `4.8s`, and generated `22/22` static pages.
- 2026-07-27: Production dependency audit reported `No known vulnerabilities found`; exact candidate and 22-commit Gitleaks scans reported no leaks.
- 2026-07-27: Local signed-out requests to `/dashboard`, `/documents`, `/templates`, `/workflows`, `/settings`, and `/integrations` all redirected to `/sign-in`.
- 2026-07-27: Local `/api/health` returned `200` and `no-store`; unauthenticated `/api/readiness` and `/api/mcp` returned `401`; all omitted `X-Powered-By` and included `nosniff` plus `DENY` framing protection.
- 2026-07-27: Local homepage browser check rendered the Support link with exact target `https://olveraproductions.com/support` and no JavaScript errors. Development Clerk-key warnings remain expected locally; production Clerk configuration is still a blocked candidate gate.
- 2026-07-27: Public `https://olveraproductions.com/support` returned `404`. Deploy and verify the Olvera Productions support route before any Paperline release containing this footer link.
- 2026-07-27: Sequence approval received. Read-only provider preflight confirmed Vercel CLI authentication as `harrisonolvera23-7297`, Olvera project `prj_1tYQlmeToQzff8QpfXqitzYmKBFo`, and Paperline project `prj_OfKl0NNnacxQ5pTX3X0QNhNkbrMc`. GitHub CLI remains unauthenticated. These identities are evidence only; deployment, commit, push, migration, domain, and DNS retain their separate approval gates.
- 2026-07-27: With explicit deployment approval, deployed the Olvera Productions support page to production deployment `dpl_GHBCpQ2bLcT9SGP2zEQPtrTTYC1p`. Vercel reported Ready; `olveraproductions.com`, `/support`, and the `www` support route returned `200`; browser read-back showed the expected support content and no visible production layout defect. Prior deployment `dpl_fFZVSVk3MgwqQrkGY6Xgf2Wtt4cC` remains the recorded rollback target.
- 2026-07-27: GitHub device-authentication workflow started after explicit approval. User-held browser authorization remains in progress; no commit or push is authorized or performed by this step.
- 2026-07-27: GitHub authentication completed and read back as `HarrisonBlake01`; `gh auth setup-git` configured the HTTPS credential helper and remote reads succeeded. Repository `HarrisonBlake01/paperline` is private, default branch `main`, and local HEAD is two commits ahead of remote before dirty candidate changes. The current private-repository plan returned `403` for branch protection/rulesets; vulnerability alerts, Dependabot alerts, and secret scanning are disabled. Vercel's Git link targets this repository with production branch `main` and automatic custom-domain assignment, so no push to `main` is authorized by authentication alone.
- 2026-07-27: Implemented recruiter-demo billing guardrails locally. `PAPERLINE_RECRUITER_DEMO=true` now keeps Stripe test keys available while rejecting live keys regardless of `PAPERLINE_ALLOW_LIVE_STRIPE`; Billing displays a no-charge test-mode notice and changes upgrade calls to action to checkout previews. The flag is documented in `.env.example` and security regression coverage proves the live-key denial.
- 2026-07-27: Complete clean recruiter-demo gate passed with `.env.local` isolated/restored, `PAPERLINE_RECRUITER_DEMO=true`, and live Stripe disabled; final marker `RECRUITER_DEMO_LOCAL_GATE_PASS`. Build compiled in `6.4s`, TypeScript completed in `4.7s`, and generated `22/22` static pages. Production audit, exact-candidate Gitleaks, and 22-commit history scan passed.
- 2026-07-27: Vercel environment-name inventory found 15 encrypted variables on the current project's stable Production target and zero Preview variables. Owner clarified that this Vercel project/`paperline-xi.vercel.app` is the recruiter site; `paperline.io` is future production. The current project's stable environment must therefore be reconciled as recruiter/demo (candidate Clerk/Supabase, restricted OpenAI, readiness, Stripe test, recruiter flag), while future production must use a separate Vercel project rather than copying or reclassifying recruiter credentials.
- 2026-07-27: Independent adversarial recruiter-demo review returned **PASS** with no Medium/High/Critical finding. It verified the environment-default live-key denial matrix, all Stripe entry points using guarded `getStripe()`, test-mode UX wording, and no client-exposed OpenAI key path.
- 2026-07-27: Read-back confirmed `paperline-xi.vercel.app` is Ready on Vercel deployment `dpl_AabZzxqmxSsMHSGpdXodpMiu7pAx` and returns `200`; it is 35 days old and does not contain the current reviewed tree. `paperline.io` did not resolve, consistent with its reserved future-production role.
- 2026-07-27: Activated the recruiter-only standing goal, froze commercial work, and reconciled bounded independent-review findings covering immutable staging before alias movement, zero-variable Preview suppression, non-waivable runtime gates, migration/old-alias compatibility, rollback, and commercial separation.
- 2026-07-28: Set project-wide `git.deploymentEnabled=false`; all branches remain available for hosted GitHub CI without creating invalid zero-variable Vercel Previews. Vercel documentation confirms the boolean form, and local JSON/workflow lint passed.
- 2026-07-28: Resolved four follow-up Medium pre-commit findings: moved the ignored environment backup outside the repository and added broad Vercel exclusions; disabled Git-triggered Vercel deployments project-wide; added durable service-role-only Storage-cleanup jobs, bounded reconciliation/backoff, and migration/route tests; and added explicit hosted TypeScript, SHA-256-pinned Actionlint, and changed/new-file final-newline gates.
- 2026-07-28: Complete clean recruiter gate passed with final marker `PAPERLINE_FINAL_CORRECTED_LOCAL_GATE_PASS`. Build compiled in `7.2s`, TypeScript completed in `4.8s`, generated `22/22` static pages, and the production dependency audit found no known vulnerabilities. Local and pinned-container Actionlint passed. Exact-candidate Gitleaks scanned approximately `24.04 MB` and history Gitleaks scanned `22` commits / approximately `1.77 MB`; neither found a leak.
- 2026-07-28: Final candidate manifest excluding these two self-referential ledgers is `d628625dfcab9c7b40877154c9c4558c33957065da9b2aa7063440a0f4127ec8` across `274` files; private recruiter media and local environment state are absent.
