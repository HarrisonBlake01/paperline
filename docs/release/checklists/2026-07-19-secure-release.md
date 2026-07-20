# Paperline secure-release checklist — 2026-07-19

Status: **Candidate runtime verification in progress; production remains NO-GO**

Governing goal: [`../../goals/setup-paperline-secure-runtime-path.goal.md`](../../goals/setup-paperline-secure-runtime-path.goal.md)

## Decisions confirmed today

- [x] Existing Supabase data is disposable/test data and may be used for candidate migration and tenant testing.
- [x] Use a separate Vercel candidate project with no production alias.
- [x] Create/configure a separate Clerk candidate application and two synthetic users.
- [x] Use the current OpenAI setup for synthetic candidate tests with a $10 ceiling.
- [x] MCP/API remains creator-bound, included on Free and paid plans, BYO-LLM for agent-side reasoning, and limited to four read-only tools.
- [x] Use a new isolated Hermes profile for Paperline.
- [x] Launch domain is `paperline.io`; do not change DNS or production alias during candidate work.
- [x] Monitoring direction: Vercel logs + scrubbed Sentry + independent health/readiness monitor.
- [x] Retention direction recorded in the secure-runtime runbook; do not publish periods until deletion/backup behavior is implemented.

## Evidence baseline

| Item | Status | Evidence |
| --- | --- | --- |
| Git baseline | Complete locally | `main` at `6056d70`, ahead of `origin/main` by one; working tree contains goal-specific local changes and the pre-existing untracked governing goal. |
| Local canonical suite | Complete locally | Parser runtime (11 text pages; 243,767 rendered bytes), readiness, security, MCP, lint, production build, and diff check exited 0 after replacing runtime `createRequire` PDF-worker resolution with traceable dynamic imports. Earlier frozen install, template, extraction-evaluation, demo, audit, and secret-scan evidence remains recorded. One Moderate dependency advisory remains. |
| Secret scans | Complete locally | Gitleaks: 232 tracked plus untracked/non-ignored files and 21 commits; zero findings. |
| OpenAI candidate compatibility | Complete locally / provider verified | `/v1/models` returned HTTP 200; `gpt-5.4` and `text-embedding-3-large` are available. No paid inference was used for this check. |
| Supabase data classification | Approved | User confirmed the current 4 workspaces, 4 memberships, and 12 documents are disposable/test data. |
| Current remote migration parity | Complete in candidate | Linked disposable project `yvouofuylmzrknratgyw` (`paperline`, West US/Oregon) now records local/remote parity through `0013`. |
| Clerk local auth | Complete for candidate configuration | Clerk CLI is authenticated and this repository is linked to `Paperline Candidate`. Candidate development keys were pulled into ignored local configuration without printing values; Email/password is enabled, Google/phone/username/organizations/billing are disabled, and candidate-only device trust was disabled so synthetic users do not require inaccessible mailbox verification. Two unlocked, unbanned synthetic users completed application sign-in and each received a separate owner workspace. |
| Candidate deployment | Ready / dependency-verified | Current immutable Preview deployment `dpl_5MSvCD13wL95yx1xhLrufPLVBZP1` at `https://paperline-candidate-4yd0v8ojx-harrisonolvera23-7297s-projects.vercel.app`; liveness returned 200. Vercel Authentication was explicitly disabled for this isolated candidate project on 2026-07-20 so Clerk/Svix and independent monitors can reach callback/health routes; Paperline/Clerk application authentication still protects private product routes. No production alias or DNS was attached. |
| NemoClaw/OpenShell | Not started | `nemoclaw`, `nemohermes`, and `openshell` are not installed. Direct Hermes verification comes first. |

## Today — ordered execution checklist

### A. Candidate database

- [x] Record the linked Supabase project identity and latest remote migration list — `supabase projects list` identified linked project `yvouofuylmzrknratgyw` (`paperline`, West US/Oregon); `migration list` showed remote `0001`–`0010`.
- [x] Confirm migration target is the disposable/test project immediately before mutation — user confirmed all current data is disposable/test data.
- [x] Apply `0011_security_hardening.sql` — `supabase db push --linked --yes` applied it first without error.
- [x] Verify migration `0011` is recorded remotely and run baseline RLS negatives — parity confirmed; anonymous workspace/document/key reads and limiter execution were denied. Authenticated Workspace A/B negatives remain in section C.
- [x] Apply `0012_workspace_rate_limits.sql` — applied second without error.
- [x] Verify allowed, exhausted, unavailable/unauthorized, and concurrent limiter behavior — `test:candidate-db` observed `[true,true,false]` at limit 2 and exactly 5/10 allowed concurrently at limit 5; anonymous RPC was denied. Local HTTP tests cover `429`/`Retry-After` and fail-closed `503`.
- [x] Apply `0013_agent_credentials.sql` — applied third; expected notice skipped a previously absent constraint before adding the reviewed constraint.
- [x] Verify legacy keys remain inactive; create/revoke/expire scoped credentials; verify unique digest and Free-plan access — candidate DB test authenticated a temporary Free credential, rejected duplicate digest (`23505`), expiry, and revocation, then removed the temporary workspace. Post-test counts returned to 4 workspaces, 4 memberships, 12 documents, and 0 API keys.
- [x] Capture final migration parity and redact all credential values — `migration list` shows local/remote `0001`–`0013`; no plaintext credential was logged or retained.

### B. Candidate identity and deployment

- [x] Create a separate Vercel candidate project; do not attach `paperline-xi.vercel.app` or `paperline.io` — created `paperline-candidate` under `harrisonolvera23-7297s-projects`.
- [x] Record Vercel team, project ID, candidate project name, branch/tree identity, and immutable deployment URL — team `harrisonolvera23-7297s-projects`, project `paperline-candidate` / `prj_m22k93l59HhrT78MvSBHWftwLYjm`, local tree based on `main` commit `6056d70421b959881a16650686c5f45283abbc12` with reviewed uncommitted candidate changes, and current immutable Preview URL `https://paperline-candidate-4yd0v8ojx-harrisonolvera23-7297s-projects.vercel.app` (`dpl_5MSvCD13wL95yx1xhLrufPLVBZP1`).
- [x] Create/configure a separate Clerk candidate application — created `Paperline Candidate` in Development with Email enabled only; Google, phone, username, organizations, and Clerk Billing are disabled. No secret value was read or copied.
- [x] Authorize Clerk CLI through the shared visible browser, link this repository to `Paperline Candidate`, and pull candidate development keys into ignored local configuration without printing them.
- [x] Create two synthetic users and Workspace A/Workspace B role fixtures — both users completed candidate sign-in; each has exactly one owner membership. Alpha has one ready one-page TXT fixture and Beta has zero documents, confirming separate initial workspace state.
- [x] Configure candidate-only Clerk redirects/origins and webhook secret — the Preview-only Clerk redirect variables are present, and real Alpha/Beta sign-in plus protected-route redirects succeeded on the candidate origin. A Clerk/Svix endpoint now targets the current immutable candidate `/api/webhooks/clerk` route; its signing secret is stored as an encrypted Preview-only Vercel variable. After redeployment, a signed `svix.ping` test reached the route and Svix recorded the attempt as `Succeeded`. Secret values and one-time dashboard URLs were removed from temporary storage.
- [x] Configure candidate Supabase, MCP host/origin, readiness, and OpenAI settings without recording values — Vercel reports 25 Preview-only environment entries with all required Clerk, Supabase, OpenAI, MCP-host, and readiness keys present; no values were printed.
- [x] Record the owner decision on the candidate OpenAI budget gate — on 2026-07-20 the owner waived the candidate-only `$10` dashboard ceiling because the intended agent workflow uses Hermes subscription routing. Paperline's built-in extraction/chat routes still have a candidate `OPENAI_API_KEY`; that distinction is recorded as an accepted synthetic-candidate cost risk rather than misrepresented as subscription-backed. Revisit provider limits before production or sustained built-in inference.
- [x] Deploy to an immutable candidate URL after migrations are present — current verified deployment is `dpl_5MSvCD13wL95yx1xhLrufPLVBZP1` (`READY`).

### C. Candidate runtime QA

- [x] Generate synthetic PDF, scanned PDF, DOCX, TXT, PNG, JPEG, malformed, mismatched, empty, and prompt-injection fixtures — `scripts/generate-candidate-fixtures.py` produced 10 cases plus a manifest (11 files, 124,407 bytes); oversized input remains runtime-generated to avoid committing a large binary.
- [x] Verify `/api/health` liveness and bearer-protected `/api/readiness` dependency status — candidate liveness returned 200; protected readiness returned 200 with configuration, database, rate-limit schema, agent-credential schema, private storage, and PDF runtime all passing.
- [x] Run two-user/two-workspace signed-in onboarding, upload, processing, extraction, cited chat, templates, workflows, settings, credential, billing-test, and sign-out paths — Alpha/Beta isolation and switching passed. Alpha's normal and adversarial TXT files reached `ready`; the fixed Invoice extraction returned HTTP 200 and persisted `succeeded`. Cited chat then returned HTTP 200 with one UI-visible and persisted source. A temporary custom-template create/delete lifecycle returned 200/200 and database verification confirmed cleanup. A one-document Invoice workflow returned HTTP 200 with one succeeded and zero failed items. Settings rendered owner role, Free plan, member controls, and recent activity. Billing rendered the Free plan and attempted a Pro test checkout, which failed safely with HTTP 500 because candidate Preview has no Stripe secret or price variables; no payment UI, charge, or checkout session was reached. This missing test-mode Stripe configuration remains an external candidate blocker rather than an application-auth failure. Temporary auth/browser artifacts were removed and Vercel automation-bypass count returned to zero.
- [x] Verify foreign document/template/chunk/storage IDs reveal no Workspace B content to Workspace A — Beta received a generic 404 for Alpha's real document URL with no filename/content disclosure. Alpha's MCP credential received `document_not_found` and `document_not_found_or_not_ready` for a real foreign-workspace document ID, with no metadata or citations returned. Template/chunk/storage negatives remain covered locally and by database/RLS tests; no deployed disclosure was observed.
- [x] Verify desktop/mobile layout, keyboard/focus, console/network, and candidate Clerk behavior for `/integrations` — authenticated desktop (1440×1000) and mobile (390×844) checks had no horizontal overflow; MCP endpoint copy, access-key creation, four-tool copy, and BYO-LLM copy remained visible at both sizes. Keyboard traversal reached 24 visible page controls, 23 with visible focus styling, including endpoint copy and key creation. Console errors were zero. Network review found only expected `net::ERR_ABORTED` Next.js navigation-prefetch cancellations during repeated route changes; no failed API, Clerk, MCP, or asset request remained on the stable page.
- [x] Verify the MCP/API integration card, BYO-LLM explanation, endpoint copy, one-time key copy, scopes, expiry, and revocation display correctly — the Free-plan card, Streamable HTTP endpoint, four-tool/BYO-LLM copy, one-time credential warning/copy, `documents:read` and `templates:read` scopes, created/expires/last-used dates, and revoke control were visually verified. Candidate MCP initialization, four-tool discovery, own-document list/summary/citation calls, real foreign-ID nondisclosure, UI revocation, and immediate post-revocation 401 all passed. Temporary passwords, bearer material, clipboard content, impersonation actors, and secret-bearing screenshots/responses were removed after verification.
- [x] Stage CSP report-only against measured candidate origins; do not enforce until violations are classified — the current candidate returns `Content-Security-Policy-Report-Only` and no enforcing CSP header. Authenticated browser measurement covered sign-in plus nine application routes. Clerk and application traffic produced no policy violations. Eleven report-only events collapsed to two Preview-only classes: the injected Vercel toolbar script from `https://vercel.live` and `eval` used by Preview instrumentation. The policy was intentionally not weakened for either deployment-platform artifact and remains report-only pending production-domain measurement and an approved nonce/hash enforcement design.

### D. Direct Hermes

- [x] Create an isolated Paperline Hermes profile/home — created `paperline-candidate` with `openai-codex/gpt-5.6-sol`; unrelated inherited MCP configuration was removed before testing.
- [x] Add the candidate endpoint with profile-scoped bearer and Vercel automation-bypass headers — both headers were configured only for the isolated candidate test, then removed after credential revocation. The profile config is mode `600` and contains no Paperline MCP entry after cleanup.
- [x] Allowlist exactly four read-only tools; disable resources, prompts, sampling, and parallel tool calls — the server exposed exactly the four intended read-only tools and advertised no resources or prompts. The reviewed isolated-client entry explicitly sets `resources: false`, `prompts: false`, `sampling.enabled: false`, and `supports_parallel_tool_calls: false`. Current Hermes MCP configuration documentation defines that final field as the client-side concurrency control, so no separate unavailable toggle is required.
- [x] Run `hermes mcp test paperline` — connected to the immutable candidate in 6.2 seconds and discovered exactly four tools.
- [x] Verify discovery, document list, summary, citations, and templates using synthetic data — protocol calls verified all four tools; a persistent interactive Hermes session then executed the deployed document-list and citation path and reported one ready authorized document with one citation. The session exited cleanly after four tool calls.
- [x] Verify foreign-ID nondisclosure and prompt-injection content remains data — real foreign-workspace summary/citation IDs returned stable not-found errors with no disclosure. Alpha then uploaded the committed synthetic `prompt-injection.txt`; candidate metadata showed one ready one-page text document with no processing error. An isolated persistent Hermes session located it through Paperline MCP, retrieved its single citation, treated embedded instructions as untrusted workspace data, and reported `unauthorized_tool_calls=0`. The session used only Paperline MCP tools and exited cleanly after four tool calls.
- [x] Revoke the credential and verify the next call fails — UI revocation produced immediate HTTP 401 `invalid_agent_credential`; the second short-lived Hermes-test credential was also revoked during cleanup.
- [x] Scan profile/log/evidence for credential or document-content leakage — 420 isolated-profile/log files were scanned after the final adversarial run with zero raw `pl_mcp_` bearer matches; the short-lived MCP credential returned HTTP 401 `invalid_agent_credential` after revocation, Vercel reported zero remaining automation bypasses, and the Paperline MCP config, temporary credential files, screenshots/responses, and clipboard contents were removed.

### E. Monitoring and retention

- [ ] Configure Sentry candidate project with request bodies, prompts, document text, and authorization data disabled/scrubbed — the official `https://skills.sentry.dev/instrument` workflow and its Next.js/error/tracing/privacy references were downloaded with `curl` and followed for `@sentry/nextjs` 10.66.0. Browser, Node.js, Edge, App Router request-error, segment-error, root-error, and `withSentryConfig` wiring are complete. PII, user info, cookies, HTTP headers/bodies, query parameters, GenAI inputs/outputs, logs, local variables, trace propagation, and replay are disabled; sampled tracing is limited to 5% outside development, excludes health/readiness, strips identifiers, and deletes span data. Final hooks remove users, extras, contexts, tags, request metadata, raw exception/message values, source-code context, console breadcrumbs, and secret-bearing URLs. A real temporary App Router endpoint sent an envelope through the initialized server SDK to a local collector: the envelope arrived with `[Filtered]`, while synthetic document text, prompt text, tokens, authorization, cookies, and query secrets were all absent. The trigger, collector, envelope, and response were removed. External project/DSN creation and Sentry-side receipt verification remain blocked on user-held Sentry OAuth/MCP authentication.
- [x] Configure independent `/api/health` and protected `/api/readiness` monitoring — Hermes script-only watchdog `3c505d37f12c` runs every 10 minutes outside the Paperline deployment, validates liveness plus authenticated dependency readiness, stays silent when healthy, and delivers failures to the originating owner channel. The readiness credential is mode `0600`, outside the repository, and is never emitted.
- [x] Verify one synthetic alert reaches the project owner — one script-only synthetic alert run completed with scheduler status `ok` and no delivery error; the temporary repeating smoke job was removed immediately after verification.
- [x] Record alert owner and incident triage path — owner: Harrison Olvera. Triage: inspect the immutable candidate and Vercel function/deployment logs, check readiness dependency names without exposing values, disable candidate traffic if tenant/auth integrity is uncertain, redeploy the last known-good immutable artifact, and follow `docs/release/secure-runtime-runbook.md` rollback/forward-fix steps.
- [ ] Implement and test document/workspace deletion before publishing retention periods.
- [ ] Verify provider/platform backup windows and forward-fix/restore behavior.

### F. NemoClaw/OpenShell follow-up

- [ ] Re-check current NVIDIA quickstart, stable versions, blueprint digest, and host requirements after direct Hermes passes.
- [ ] Decide the non-production host for one disposable Hermes sandbox.
- [ ] Install only through the then-current official NVIDIA-supported path.
- [ ] Add Paperline through managed MCP with a dedicated provider-held credential.
- [ ] Verify allowed calls, denied host/path/method, raw credential non-disclosure, rotation, and revocation.

## Stop conditions

Stop immediately on target ambiguity, non-disposable data, migration error, cross-tenant disclosure, valid revoked credential, secret exposure, unexpected provider spend, readiness failure, parser/native crash, wider-than-approved OpenShell policy, or rollback uncertainty.

## Production gate

Production remains **NO-GO** until candidate migration, identity, parser, signed-in tenant, direct Hermes, monitoring, rollback, deletion/retention, residual-risk, and explicit production approvals are complete. NemoClaw/OpenShell remains an enterprise validation follow-up and must not be claimed as integrated before its managed-sandbox checklist passes.
