# Paperline pre-deployment test matrix — 2026-07-27

Status: **GO FOR RECRUITER VIEWING — the reviewed Node 22 source is live at `paperline-demo.olveraproductions.com` with production Clerk, complete domain verification, signed webhooks, healthy readiness, and Stripe sandbox lifecycle evidence. Refreshed authenticated depth, monitoring, backup, rollback, and commercial gates remain open.**

This is the execution checklist that must be completed before Paperline is deployed or attached to `paperline.io`. It separates local evidence from real candidate and production evidence. Passing source validators or a local build does not complete a candidate/runtime test.

## Deployment mapping

- **Recruiter/demo:** current Vercel project `paperline` (`prj_OfKl0NNnacxQ5pTX3X0QNhNkbrMc`), whose Vercel target is named `production`, served to recruiters at `https://paperline-demo.olveraproductions.com`; `paperline-xi.vercel.app` remains the established Vercel/Stripe callback host. In this project, “Production” means the stable recruiter site—not the future commercial Paperline production environment.
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
- [x] Require a clean reviewed Git commit/tree matching the recorded candidate — release SHA `c8c05ece30aab539895172c70e0994cdb723d929` is clean and matches the remote release branch.
- [x] Push a non-production release branch and require hosted CI before merge or production deployment — GitHub Actions run `30355115629` passed both jobs on exact SHA `c8c05ec`.

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
- [c] Production Clerk keys are deployed; DNS, SSL, mail, and OAuth report complete; the sign-in surface renders without Development mode; and the least-privilege `user.created` webhook accepted a correctly signed non-mutating `test.ping` with HTTP `200`.
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
- [c] On the deployed recruiter candidate, verify test Checkout/payment-method UX and prove that no live Stripe key, Price, Customer, payment method, or charge is reachable — test Checkout creation/idempotent retry, signed webhook-driven Pro entitlement, immediate sandbox cancellation, Pro→Free reconciliation, and full synthetic fixture cleanup passed. Final live-mode denial/provider read-back remains open because Vercel masks encrypted values.
- [!] In Stripe test mode, verify customer/session idempotency across dropped responses and retries.
- [!] Verify a second logical operation cannot create a duplicate paid subscription.
- [c] Verify Checkout completion, billing portal access, cancellation, and entitlement changes — Checkout completion, Free→Pro entitlement, immediate sandbox cancellation, signed-webhook Pro→Free transition, and application-lifecycle synthetic fixture cleanup passed. Portal verification remains.
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
- [c] On the promoted recruiter site, `/api/health` returns `200` with `Cache-Control: no-store`; missing-token `/api/readiness` returns `401` with `no-store`; an authorized readiness probe returns `200` with configuration, database, rate-limit schema, agent-credential schema, private Storage, and PDF runtime all healthy.
- [c] Verify HSTS/HTTPS, CSP decision, frame/content-type/referrer/permissions headers, and absence of `X-Powered-By` — HSTS, `nosniff`, `DENY`, strict-origin referrer policy, restrictive permissions policy, and no `X-Powered-By` pass on the stable alias. CSP remains Report-Only and requires a final policy decision.
- [!] Verify upload size/type/signature mismatch, malformed/empty file, decompression/parser failure, and prompt-injection fixtures fail safely.
- [!] Verify logs, Sentry events, analytics, audit records, and webhook errors contain no document text, prompts, cookies, authorization headers, tokens, or secrets.

## Test group 9 — observability, rollback, backup, and launch operations

- [!] Assign a named human owner for Vercel/runtime, Clerk, Supabase, OpenAI, Stripe, security, deletion, and support incidents.
- [!] Deliver one synthetic alert through the actual monitoring path.
- [!] Capture the pre-deploy Vercel deployment/alias and document code rollback.
- [!] Verify database forward-fix procedure; do not destructively roll back migrations `0017`–`0018`.
- [!] Record database backup/PITR and Storage-object backup limits; obtain explicit residual-risk acceptance where needed.
- [!] Verify environment-variable inventory and target scopes without printing values.
- [x] Correct Vercel runtime from Node `24.x` to repository-pinned Node `22.x` — project and exact deployment read-back on 2026-07-29 both report `22.x`; build logs prove `pnpm install --frozen-lockfile` and `pnpm build`.
- [x] Deploy and promote the reviewed recruiter candidate to the current `paperline` Vercel project — Node 22 deployment `dpl_AEot26nPWddDc117PDRs3xNPjWGG` is Ready/Promoted with explicit metadata binding it to exact reviewed SHA `c8c05ec`; `paperline-xi.vercel.app` resolves to it.
- [!] Complete the remaining authenticated-depth and commercial-operations tests before any claim beyond controlled recruiter viewing.
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
- 2026-07-28: Final candidate manifest excluding these two self-referential ledgers is `8b151f2d13b615914a8c847c9654569aa2dbb8ae432e4d803de7c8aab978bfb4` across `274` files; private recruiter media and local environment state are absent.
- 2026-07-28: Hosted GitHub Actions run [`30354886674`](https://github.com/HarrisonBlake01/paperline/actions/runs/30354886674) passed both jobs on substantive candidate SHA `6622c2303e942a6536afdb316d7298d1d7885d3f`. Its first secret-job attempt encountered a transient Docker Hub connection reset; rerunning only the failed job passed without a code change.
- 2026-07-28: Follow-up evidence commit `c8c05ece30aab539895172c70e0994cdb723d929` was pushed to `release/recruiter-portfolio-2026-07-28`; hosted GitHub Actions run [`30355115629`](https://github.com/HarrisonBlake01/paperline/actions/runs/30355115629) passed both **Secret scan** and **Test, lint, build, and audit** on that exact SHA.
- 2026-07-28: Immutable recruiter candidate `dpl_5DmJWSZQnUTHeTgHWF3jpQ522tKY` completed a Next.js `16.2.12` build using `pnpm 10.33.4`, `pnpm install --frozen-lockfile`, and `pnpm build`; Vercel reports Ready. The stable alias remains on prior deployment `dpl_AabZzxqmxSsMHSGpdXodpMiu7pAx` / Git SHA `5f1b69a`.
- 2026-07-28: The bounded real Stripe webhook retry did **not** produce acceptance evidence because the one-shot cron environment could not find `pnpm` before starting its state poll. Its fail-safe restored Vercel Authentication to `all_except_custom_domains`. This is an automation-environment failure, not an application webhook pass or failure; signed webhook entitlement and cancellation remain open.
- 2026-07-29: Read-only reconciliation confirmed the release branch is clean at `c8c05ec`, the exact hosted run remains green, the immutable candidate remains Ready and protected by Vercel Authentication, all required recruiter/Stripe variable names are registered in Production scope, the stable alias returns `200`, and the project-level Node setting still reports `24.x`. No provider setting, alias, deployment, database, Stripe object, or Git state was changed.
- 2026-07-29: With explicit approval, changed the recruiter/demo Vercel project from Node `24.x` to `22.x` and verified the project read-back. The first exact-worktree CLI attempt was blocked before build because Vercel could not map the GitHub no-reply author to the Vercel team; no history or author metadata was rewritten. The documented no-Git fallback deployed the exact `c8c05ec` archive (`1473301378ba8cbbe583075efdfa832ada66f9a816a1fc50fe2c36ff9e0930ec`) with explicit candidate-SHA metadata. Deployment `dpl_AEot26nPWddDc117PDRs3xNPjWGG` is Ready/Staged on Node `22.x`; install, Next.js `16.2.12` build, TypeScript, and deployment completed successfully. Vercel moved only the generated project aliases to the staged candidate; `paperline-xi.vercel.app` remains on `dpl_AabZzxqmxSsMHSGpdXodpMiu7pAx` and returns `200`.
- 2026-07-29: Unauthenticated probes to the new generated candidate alias return Vercel protection (`302` for pages/health and `401 Protected deployment` for the Stripe callback), so Stripe still cannot reach the webhook. A bounded protection change or stable-alias promotion is required before real provider delivery; neither is implied by the Node/redeploy approval. One pre-existing automation-bypass credential is registered and remains untouched pending explicit cleanup approval.
- 2026-07-29: Read-only database reconciliation discovered that the real signed Stripe event had already been accepted on 2026-07-28 at `20:18:03Z`, before the later watcher failure. The sole billing operation is `completed` for requested plan Pro; its Customer and Session references exist; the linked workspace is active on Pro with page limit `1000`, matching Customer linkage, and a subscription reference. Counts are Free `9`, Pro `1`, Team `0`; pending billing operations `0`; Storage cleanup jobs `0`. No IDs or secret values were printed. The cron failure was therefore only a failed poll/report, not a webhook-delivery failure. Sandbox cancellation, Pro→Free webhook transition, and disposable fixture cleanup remain required.
- 2026-07-29: An explicitly approved, fail-safe 15-minute cancellation window opened successfully: with Vercel Authentication temporarily disabled, the generated candidate alias reached the application webhook and rejected an invalid signature with HTTP `400`. No Stripe cancellation arrived before timeout. The fail-safe restored `all_except_custom_domains`, revoked the one stale automation-bypass credential (verified count `0`), removed temporary poll files, and left the fixture unchanged at active Pro / page limit `1000` with its subscription reference present. Protected health and webhook probes again return `302` and `401`, respectively.
- 2026-07-29: User removed the redundant `paperline-candidate` Vercel project/domain and attempted to remove the generated `paperline-harrison…` alias. Read-back confirms only the `paperline` project remains; `paperline-candidate.vercel.app` returns `404`; the only attached project domain is `paperline-xi.vercel.app`. Vercel still automatically exposes `paperline-harrisonolvera23-7297s-projects.vercel.app` behind SSO as provider-managed alias plumbing. The reviewed Node 22 candidate deployment `dpl_AEot26nPWddDc117PDRs3xNPjWGG` remains Ready/Staged and its immutable URL remains protected. The promoted recruiter alias remains on prior deployment `dpl_AabZzxqmxSsMHSGpdXodpMiu7pAx` and returns `200`.
- 2026-07-29: With explicit alias-promotion approval, promoted exact reviewed deployment `dpl_AEot26nPWddDc117PDRs3xNPjWGG` / SHA `c8c05ec` to `paperline-xi.vercel.app`. API read-back reports Ready/Promoted and Node `22.x`. Public smoke: `/`, `/api/health`, `/contact`, `/privacy`, `/terms`, `/status`, and `/changelog` return `200`; signed-out `/ops-agent` returns `307`; security headers include HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer-Policy, and Permissions-Policy. The public Stripe route reaches application verification and returns `400 invalid_signature` for an intentionally invalid probe. Vercel environment values are encrypted at read-back, so host/mode values remain an explicit runtime/provider verification item rather than being inferred from ciphertext.
- 2026-07-29: With explicit provider approval, user permanently changed the Stripe sandbox webhook destination to `https://paperline-xi.vercel.app/api/webhooks/stripe` without rotating or exposing its signing secret. Vercel runtime logs prove the resent `customer.subscription.deleted` delivery returned `200`. Authoritative database read-back proves the linked active workspace transitioned from Pro / `1000` pages / subscription present to Free / `25` pages / subscription absent while retaining its Customer reference; `25` matches `src/lib/plans.ts`. The initial watcher expected the obsolete value `50`, so it was stopped and its temporary poll file removed after direct state verification. Cancellation and Pro→Free entitlement reconciliation pass; application-lifecycle cleanup of the synthetic Customer/workspace remains.
- 2026-07-29: With the previously approved full synthetic-fixture cleanup, invoked the promoted application's fenced `DELETE /api/workspace` lifecycle using a short-lived Clerk session for the sole eligible owner. Scope preflight proved exactly one active Free workspace with a canceled subscription, one owner membership, and a recognizably synthetic Clerk account. The application returned `200`, enforcing Stripe Customer deletion before database finalization; read-back proves the workspace and membership are absent, the synthetic Clerk user is deleted, workspace baseline is restored to `9`, and Storage cleanup jobs are `0`. The temporary Clerk session was revoked and all temporary scripts were removed.
- 2026-07-29: Fresh read-only stable-site acceptance confirmed the recruiter/test-mode banner is visible; public/legal/status routes return `200`; `/api/health` is `200/no-store`; missing-token `/api/readiness` is `401/no-store`; an authorized readiness probe returns `200` with all six dependency checks healthy; protected app routes redirect internally to `/sign-in`; the sign-in form renders; HSTS, frame/content-type/referrer/permissions headers pass; and no JavaScript exception was observed. Clerk visibly labels the sign-in surface `Development mode` and emits development-key warnings, so authenticated runtime acceptance remains blocked on an explicitly approved recruiter Clerk production-instance/key migration and read-back.
- 2026-07-29: Migrated the recruiter environment to Clerk production. `clerk deploy status` reports DNS, SSL, mail, and OAuth complete for `paperline-demo.olveraproductions.com`; deployed sign-in no longer shows Development mode. Created the production Svix endpoint for `/api/webhooks/clerk`, restricted it to `user.created`, registered its endpoint-specific sensitive secret in Vercel Production, redeployed reviewed source `c8c05ec`, and received HTTP `200` for a correctly signed non-mutating `test.ping`. Temporary portal, signing, body, and response files were removed.
- 2026-07-29: Final recruiter audit corrected the Clerk application label from the internal `Paperline Candidate` name to `Paperline`; browser read-back now shows `Sign in to Paperline` with no console errors. Public/legal routes return `200`, protected app routes redirect with `307`, health returns `200`, missing-token readiness returns `401`, and authenticated readiness returns `ready: true` with all six checks `ok: true`. Lighthouse scored desktop performance `99`, accessibility `100`, best practices `96`, and SEO `100`; mobile accessibility and SEO were also `100` with performance `72` recorded as optimization debt. Every application suite, disposable PostgreSQL lifecycle test, TypeScript, lint, the `22/22`-page production build, and the production dependency audit passed. Exact tracked/non-ignored Gitleaks scanned approximately `24.06 MB`; Git-history Gitleaks scanned `26` commits / approximately `2.05 MB`; neither found a leak.
